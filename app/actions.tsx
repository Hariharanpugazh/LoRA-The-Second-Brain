"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage } from "ai";
import { modelService } from "@/lib/model-service";
import { rateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import fs from 'fs';
import path from 'path';

let localInferenceService: any = null;

const MODELS_DIR = path.join(process.cwd(), 'models');

// Check if a model is a locally downloaded file (not managed by Ollama)
async function isLocalDownloadedModel(modelName: string): Promise<boolean> {
  try {
    if (!fs.existsSync(MODELS_DIR)) return false;
    const files = fs.readdirSync(MODELS_DIR);
    const modelFiles = files.filter(
      (f) => f.toLowerCase().endsWith(".gguf") || f.toLowerCase().endsWith(".bin")
    );
    return modelFiles.some(
      (file) => file.replace(/\.(gguf|bin)$/i, "") === modelName
    );
  } catch {
    return false;
  }
}

// Generate response using local GGUF model
async function generateLocalModelResponse(messages: CoreMessage[], model: string) {
  const stream = createStreamableValue();

  (async () => {
    try {
      if (!localInferenceService) {
        const mod = await import("@/lib/local-inference-service");
        localInferenceService = mod.localInferenceService;
      }

      const exists = await localInferenceService.modelExists(model);
      if (!exists) {
        throw new Error(`Local model not found: ${model}`);
      }

      // Normalize messages to plain strings
      const formatted = [
        {
          role: "system",
          content: `You are a local LLM running as model: ${model}. If the user asks what model you are, answer with exactly "${model}".`
        },
        ...messages.map(m => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
        }))
      ];

      const generator = await localInferenceService.generateResponse(model, formatted, {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 512,
        repetitionPenalty: 1.1,
      });

      let acc = "";
      for await (const chunk of generator) {
        acc += chunk;
        stream.update(acc); // progressively stream full text to the client
      }
      stream.done();
    } catch (err: any) {
      stream.update(
        `Local inference error for "${model}": ${err?.message ?? "Unknown error"}`
      );
      stream.done();
    }
  })();

  return stream.value;
}

export async function continueConversation(messages: CoreMessage[], model: string) {
  const ip = headers().get("x-forwarded-for") ?? "unknown";
  const isLimited = rateLimit(ip);
  if (isLimited) {
    throw new Error(`Rate Limit Exceeded for ${ip}`);
  }

  const isLocal = await isLocalDownloadedModel(model);
  if (isLocal) {
    return await generateLocalModelResponse(messages, model);
  }

  // Ollama path
  const isOllamaRunning = await modelService.checkOllamaStatus();
  if (!isOllamaRunning) {
    throw new Error(
      "Ollama is not running. Start Ollama or pick a local GGUF file model."
    );
  }

  const response = await modelService.generateResponse(model, messages, {
    temperature: 0.8,
    topP: 0.7,
    maxTokens: 1024,
  });

  const stream = createStreamableValue();
  (async () => {
    try {
      let acc = "";
      for await (const chunk of response) {
        if (chunk.done) break;
        const content = chunk.message?.content || "";
        acc += content;
        stream.update(acc);
      }
      stream.done();
    } catch (e) {
      stream.error(e as Error);
    }
  })();

  return stream.value;
}
