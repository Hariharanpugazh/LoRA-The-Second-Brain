import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HuggingFaceModel, LocalModel } from "@/lib/model-service";

// Query keys
export const modelQueryKeys = {
  huggingFaceModels: (query: string) => ['huggingFaceModels', query] as const,
  localModels: ['localModels'] as const,
  localFiles: ['localFiles'] as const,
  ollamaStatus: ['ollamaStatus'] as const,
};

// Fetch Hugging Face models
export function useHuggingFaceModels(query: string = 'gguf') {
  return useQuery({
    queryKey: modelQueryKeys.huggingFaceModels(query),
    queryFn: async (): Promise<HuggingFaceModel[]> => {
      const response = await fetch(`/api/models?type=huggingface&query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch local models
export function useLocalModels() {
  return useQuery({
    queryKey: modelQueryKeys.localModels,
    queryFn: async (): Promise<LocalModel[]> => {
      const host = typeof window !== 'undefined' ? localStorage.getItem('ollama_host') : null;
      const url = host ? `/api/models?type=local&host=${encodeURIComponent(host)}` : '/api/models?type=local';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch local models');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry if Ollama is not running
      if (error instanceof Error && error.message.includes('Failed to fetch local models')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Fetch local files (directly downloaded models)
export function useLocalFiles() {
  return useQuery({
    queryKey: modelQueryKeys.localFiles,
    queryFn: async (): Promise<LocalModel[]> => {
      const response = await fetch('/api/models?type=local-files');
      if (!response.ok) {
        throw new Error('Failed to fetch local files');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Check Ollama status
export function useOllamaStatus() {
  return useQuery({
    queryKey: modelQueryKeys.ollamaStatus,
    queryFn: async (): Promise<boolean> => {
      const host = typeof window !== 'undefined' ? localStorage.getItem('ollama_host') : null;
      const url = host ? `/api/models?type=status&host=${encodeURIComponent(host)}` : '/api/models?type=status';
      const response = await fetch(url);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.isRunning;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// Download model mutation with progress tracking
export function useDownloadModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, downloadSource = 'ollama', onProgress }: {
      modelId: string;
      downloadSource?: 'ollama' | 'direct';
      onProgress?: (progress: { status: string; progress: number; message: string }) => void;
    }) => {
      const host = typeof window !== 'undefined' ? localStorage.getItem('ollama_host') : null;
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId, downloadSource, host }),
      });

      if (!response.ok) {
        throw new Error('Failed to start download');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onProgress?.(data);

              if (data.status === 'completed') {
                // Invalidate both local models and local files queries
                queryClient.invalidateQueries({ queryKey: modelQueryKeys.localModels });
                queryClient.invalidateQueries({ queryKey: modelQueryKeys.localFiles });
                return true;
              }

              if (data.status === 'error') {
                throw new Error(data.message);
              }
            } catch (error) {
              console.error('Failed to parse progress data:', error);
            }
          }
        }
      }

      return true;
    },
  });
}

// Delete model mutation
export function useDeleteModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelName: string): Promise<boolean> => {
      const host = typeof window !== 'undefined' ? localStorage.getItem('ollama_host') : null;
      const url = host ? `/api/models?name=${encodeURIComponent(modelName)}&host=${encodeURIComponent(host)}` : `/api/models?name=${encodeURIComponent(modelName)}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete model');
      }
      const data = await response.json();
      return data.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelQueryKeys.localModels });
      queryClient.invalidateQueries({ queryKey: modelQueryKeys.localFiles });
    },
  });
}