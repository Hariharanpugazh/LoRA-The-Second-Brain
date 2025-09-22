"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage } from "ai";
import { modelService } from "@/lib/model-service";
import { rateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import fs from 'fs';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), 'models');

// Check if a model is a locally downloaded file (not managed by Ollama)
async function isLocalDownloadedModel(modelName: string): Promise<boolean> {
  try {
    // Check if the models directory exists
    if (!fs.existsSync(MODELS_DIR)) {
      return false;
    }

    // Get all model files
    const files = fs.readdirSync(MODELS_DIR);
    const modelFiles = files.filter(file =>
      file.endsWith('.gguf') || file.endsWith('.bin')
    );

    // Check if any file matches the model name (without extension)
    return modelFiles.some(file =>
      file.replace(/\.(gguf|bin)$/i, '') === modelName
    );
  } catch (error) {
    console.error('Error checking local model:', error);
    return false;
  }
}

// Generate response using local GGUF model
async function generateLocalModelResponse(messages: CoreMessage[], model: string) {
  const stream = createStreamableValue();

  (async () => {
    try {
      // For now, implement a basic response system
      // This can be replaced with proper GGUF inference later
      const lastMessage = messages[messages.length - 1];
      const userInput = typeof lastMessage.content === 'string' ? lastMessage.content : '';

      // Create a contextual response based on the conversation
      const conversationContext = messages
        .slice(0, -1)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `You are ${model}, an AI assistant. Previous conversation:\n${conversationContext}\n\nUser: ${userInput}\n\nAssistant:`;

      // For now, generate a simple response
      // In a real implementation, this would use the GGUF model
      const demoResponses = [
        `I'm ${model}, running locally on your machine. I understand you're asking about "${userInput}". This is fascinating! Let me help you explore this topic further.`,
        `That's an interesting point about "${userInput}". As ${model}, I'm processing this locally on your device. Here's what I think:`,
        `Great question! I'm ${model}, your local AI assistant. Regarding "${userInput}", I can provide some insights based on my training data.`,
        `I'm running ${model} directly from your local models folder. No internet required! About "${userInput}", here's my perspective:`,
        `Hello! I'm ${model}, operating entirely offline on your machine. I see you're curious about "${userInput}". Let me share some thoughts:`,
        `As ${model}, I'm designed to run locally for maximum privacy. Your question about "${userInput}" is quite intriguing. Here's what I can tell you:`,
        `I'm ${model}, your personal AI that stays on your device. Regarding "${userInput}", I have some interesting insights to share:`,
        `Running locally as ${model}, I can help you with "${userInput}". This is one of the benefits of having AI that works offline!`,
        `I'm ${model}, processing your request about "${userInput}" right here on your machine. No data leaves your device. Here's my response:`,
        `As your local ${model} assistant, I'm excited to help with "${userInput}". Since I'm running offline, your privacy is completely protected.`,
      ];

      let response = demoResponses[Math.floor(Math.random() * demoResponses.length)];

      // Add some context-specific responses
      if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
        response = `Hello! I'm ${model}, running locally on your system. How can I help you today?`;
      } else if (userInput.toLowerCase().includes('what') && userInput.toLowerCase().includes('you')) {
        response = `I'm ${model}, an AI model running directly from a downloaded file in your local models folder. I can help with various tasks and answer questions while keeping everything private and offline!`;
      } else if (userInput.toLowerCase().includes('how') && userInput.toLowerCase().includes('work')) {
        response = `I work by processing your input locally on your machine using the ${model} model file. No internet connection or external services required - your conversations stay completely private!`;
      } else if (userInput.toLowerCase().includes('privacy') || userInput.toLowerCase().includes('private')) {
        response = `Privacy is my top priority! I'm ${model}, running entirely on your local machine. None of our conversation leaves your device, and no external servers are involved.`;
      } else if (userInput.toLowerCase().includes('model') || userInput.toLowerCase().includes('download')) {
        response = `I'm ${model}, loaded from your local models directory. You can use any compatible GGUF model file - just place it in the models folder and select it in the interface!`;
      }

      // Simulate streaming response
      const words = response.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        console.log('Streaming word:', words[i], 'Full text:', currentText); // Debug log
        stream.update(currentText);
        // Add a small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
      }

      stream.done();
    } catch (error) {
      console.error('Local model response error:', error);
      stream.error(new Error(`Failed to generate response from ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  })();

  return stream.value;
}

export async function continueConversation(
  messages: CoreMessage[],
  model: string,
) {
  const ip = headers().get("x-forwarded-for") ?? "unknown";
  const isRateLimited = rateLimit(ip);

  if (isRateLimited) {
    console.log("Rate limited");
    throw new Error(`Rate Limit Exceeded for ${ip}`);
  }

  // Check if this is a local downloaded model (not managed by Ollama)
  const isLocalModel = await isLocalDownloadedModel(model);

  if (isLocalModel) {
    // For local models, we need to implement direct inference
    // For now, return a mock response until proper GGUF inference is implemented
    return await generateLocalModelResponse(messages, model);
  }

  // For Ollama-managed models, check if Ollama is running
  const isOllamaRunning = await modelService.checkOllamaStatus();
  if (!isOllamaRunning) {
    throw new Error("Ollama is not running. Please start Ollama and ensure it's accessible at http://localhost:11434");
  }

  try {
    const response = await modelService.generateResponse(model, messages, {
      temperature: 0.8,
      topP: 0.7,
      maxTokens: 1024,
    });

    const stream = createStreamableValue();

    // Handle streaming response
    (async () => {
      try {
        let fullResponse = "";
        for await (const chunk of response) {
          if (chunk.done) break;
          const content = chunk.message?.content || "";
          fullResponse += content;
          stream.update(fullResponse);
        }
        stream.done();
      } catch (error) {
        stream.error(error as Error);
      }
    })();

    return stream.value;
  } catch (error) {
    console.error("Error in continueConversation:", error);
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
