import { Ollama } from 'ollama';

export type InferenceBackend = 'ollama-cpu' | 'ollama-gpu' | 'webgpu' | 'wasm';

export interface HuggingFaceModel {
  id: string;
  name: string;
  size: string;
  format: string;
  downloads: number;
  likes: number;
  tags: string[];
  author: string;
  quantization?: string; // Q4_K_M, Q5_K_M, etc.
}

export interface LocalModel {
  name: string;
  size: string;
  format: string;
  downloadedAt: string;
  backend: InferenceBackend;
}

class ModelService {
  private ollama: Ollama;
  private backend: InferenceBackend;

  constructor(backend: InferenceBackend = 'ollama-cpu') {
    this.backend = backend;
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
  }

  // Set inference backend
  setBackend(backend: InferenceBackend) {
    this.backend = backend;
  }

  // Fetch available models from Hugging Face
  async fetchHuggingFaceModels(query: string = 'gguf', limit: number = 50): Promise<HuggingFaceModel[]> {
    try {
      const response = await fetch(
        `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&limit=${limit}&sort=downloads&direction=-1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch models from Hugging Face');
      }

      const models = await response.json();

      return models.map((model: any) => ({
        id: model.id,
        name: model.id.split('/')[1],
        size: this.extractModelSize(model.id),
        format: this.detectFormat(model.tags || []),
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        tags: model.tags || [],
        author: model.id.split('/')[0]
      }));
    } catch (error) {
      console.error('Error fetching Hugging Face models:', error);
      return [];
    }
  }

  // Get locally available models from Ollama
  async getLocalModels(): Promise<LocalModel[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map(model => ({
        name: model.name,
        size: this.formatSize(model.size),
        format: 'GGUF',
        downloadedAt: model.modified_at ? new Date(model.modified_at).toISOString() : new Date().toISOString(),
        backend: this.backend
      }));
    } catch (error) {
      console.error('Error fetching local models:', error);
      return [];
    }
  }

  // Download a model from Hugging Face
  async downloadModel(modelId: string): Promise<boolean> {
    try {
      await this.ollama.pull({ model: modelId });
      return true;
    } catch (error) {
      console.error('Error downloading model:', error);
      return false;
    }
  }

  // Delete a local model
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      await this.ollama.delete({ model: modelName });
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      return false;
    }
  }

  // Generate response using local model with memory optimization
  async generateResponse(model: string, messages: any[], options: any = {}): Promise<any> {
    try {
      const response = await this.ollama.chat({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true,
        options: {
          temperature: options.temperature || 0.8,
          top_p: options.topP || 0.7,
          num_predict: options.maxTokens || 1024,
          // Memory optimization options
          num_ctx: 2048, // Limit context window to reduce memory
          num_thread: -1, // Use all available threads
          num_gpu: 0, // Disable GPU to save VRAM, use CPU only
          ...options
        }
      });

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  // Check if Ollama is running
  async checkOllamaStatus(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractModelSize(modelId: string): string {
    const sizeMatch = modelId.match(/(\d+(?:\.\d+)?)([bBkKmMgGtT])/i);
    if (sizeMatch) {
      const [, size, unit] = sizeMatch;
      return `${size}${unit.toUpperCase()}`;
    }
    return 'Unknown';
  }

  private detectFormat(tags: string[]): string {
    if (tags.some(tag => tag.toLowerCase().includes('gguf'))) return 'GGUF';
    if (tags.some(tag => tag.toLowerCase().includes('h2o'))) return 'H2O-Danube';
    if (tags.some(tag => tag.toLowerCase().includes('safetensors'))) return 'SafeTensors';
    return 'Unknown';
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

export const modelService = new ModelService();