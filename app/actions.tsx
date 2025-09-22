"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage } from "ai";
import { modelService } from "@/lib/model-service";
import { rateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

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

  // Check if Ollama is running
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
