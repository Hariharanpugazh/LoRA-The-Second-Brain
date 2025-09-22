"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { type CoreMessage } from "ai";
import { BsNvidia } from "react-icons/bs";
import ChatInput from "./chat-input";
import { readStreamableValue } from "ai/rsc";
import { FaUserAstronaut } from "react-icons/fa6";
import { continueConversation } from "../app/actions";
import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import { MemoizedReactMarkdown } from "./markdown";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default function Chat() {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("google/gemma-2-9b-it");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim().length === 0) return;

    const newMessages: CoreMessage[] = [
      ...messages,
      { content: input, role: "user" },
    ];

    setMessages(newMessages);
    setInput("");

    try {
      const result = await continueConversation(newMessages, model);

      for await (const content of readStreamableValue(result)) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: content as string,
          },
        ]);
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="stretch mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 pb-[8rem] pt-[6rem] md:px-0 md:pt-[4rem] xl:pt-[2rem]">
        <h1 className="text-center text-5xl font-medium tracking-tighter">
          LoRA: The Second Brain
        </h1>

        <div className="mt-6 px-3 md:px-0">
          <h2 className="text-lg font-medium">🔹 What is LoRA: The Second Brain?</h2>
          <p className="mt-2 text-sm text-primary/80">
            LoRA (your project) is an offline personal AI hub. Think of it as your own private assistant + second brain that lives entirely on your device. It’s built on top of Open WebUI, but rebranded and extended with extra features so it’s not “just another AI chat.”
          </p>
          <p className="mt-2 text-sm text-primary/80">
            The idea is:
          </p>
          <ul className="ml-6 mt-2 flex list-disc flex-col items-start gap-2.5 text-sm text-primary/80">
            <li>You download free/open models (from Hugging Face, Ollama, etc.) and run them locally.</li>
            <li>Everything happens offline — no external servers, no spying, no leaks.</li>
            <li>Instead of being just a chatbot, it becomes a knowledge companion that remembers, organizes, and connects your thoughts.</li>
          </ul>

          <h2 className="mt-6 text-lg font-medium">🔹 Core Pillars of LoRA</h2>
          <div className="mt-2 space-y-3 text-sm text-primary/80">
            <p><strong>Offline AI:</strong> Powered by engines like llama.cpp, Ollama, or vLLM depending on hardware.</p>
            <p><strong>Open Model Freedom:</strong> Lets you use LoRA adapters to fine-tune models for coding, teaching, research, or creative writing.</p>
            <p><strong>Second Brain Features:</strong> Lets you recall past thoughts: "What did I plan last Monday?" AI builds connections between your ideas like Obsidian + memory + AI.</p>
            <p><strong>Privacy & Control:</strong> Optional encryption so even if someone grabs your files, they can't read them.</p>
            <p><strong>Custom Branding & UX:</strong> Optimized for speed, memory, and usability so it feels polished.</p>
          </div>
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          model={model}
          handleModelChange={handleModelChange}
        />
      </div>
    );
  }

  return (
    <div className="stretch mx-auto w-full max-w-2xl px-4 py-[8rem] pt-24 md:px-0">
      {messages.map((m, i) => (
        <div key={i} className="mb-4 flex items-start p-2">
          <div
            className={cn(
              "flex size-8 shrink-0 select-none items-center justify-center rounded-lg",
              m.role === "user"
                ? "border bg-background"
                : "bg-nvidia border border-[#628f10] text-primary-foreground",
            )}>
            {m.role === "user" ? <FaUserAstronaut /> : <BsNvidia />}
          </div>
          <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
            <MemoizedReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm break-words dark:prose-invert prose-pre:rounded-lg prose-pre:bg-zinc-100 prose-pre:p-4 prose-pre:text-zinc-900 dark:prose-pre:bg-zinc-900 dark:prose-pre:text-zinc-100">
              {m.content as string}
            </MemoizedReactMarkdown>
          </div>
        </div>
      ))}
      <div ref={messageEndRef} />
      <ChatInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        model={model}
        handleModelChange={handleModelChange}
      />
    </div>
  );
}
