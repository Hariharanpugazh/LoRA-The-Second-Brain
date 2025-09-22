"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { type CoreMessage } from "ai";
import ChatInput from "./chat-input";
import { readStreamableValue } from "ai/rsc";
import { FaUser } from "react-icons/fa6";
import { FaBrain } from "react-icons/fa6";
import { continueConversation } from "../app/actions";
import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import { MemoizedReactMarkdown } from "./markdown";
import { useUser } from "./user-context";
import { DatabaseService, Conversation } from "@/lib/database";
import { useConversations, useCreateConversation, useUpdateConversation } from "@/lib/database-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useConversation } from "./conversation-context";
import { useModel } from "./app-content";
import { Pin, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { EncryptedConversationStorage } from "@/lib/encrypted-conversation-storage";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default function Chat() {
  const { currentUser } = useUser();
  const { currentConversationId, setCurrentConversationId } = useConversation();
  const { currentModel, onModelChange } = useModel();
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations(currentUser?.id || '');
  const queryClient = useQueryClient();
  const router = useRouter();
  const createConversationMutation = useCreateConversation();
  const updateConversationMutation = useUpdateConversation();
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Load conversations when user changes
  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
    }
  }, [currentUser]);

  // Load conversation when currentConversationId changes
  useEffect(() => {
    console.log('currentConversationId changed:', currentConversationId, 'messages length:', messages.length);
    if (currentConversationId) {
      loadConversation(currentConversationId);
    } else {
      console.log('Clearing messages for new chat');
      setMessages([]);
    }
  }, [currentConversationId]);

  const createNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await DatabaseService.getConversationById(conversationId);
      if (conversation) {
        // If conversation has encrypted data, try to load the decrypted messages
        if (conversation.encryptedPath && currentUser?.password) {
          try {
            const decryptedConversation = await EncryptedConversationStorage.loadConversation(
              conversation.encryptedPath,
              currentUser.password
            );
            setMessages(decryptedConversation.messages || []);
            onModelChange(decryptedConversation.model || '');
          } catch (error) {
            console.error('Failed to decrypt conversation:', error);
            // Fallback to unencrypted messages if available
            setMessages(conversation.messages || []);
            onModelChange(conversation.model || '');
            toast.error('Failed to load encrypted conversation - using unencrypted data');
          }
        } else {
          // Use unencrypted conversation data
          setMessages(conversation.messages || []);
          onModelChange(conversation.model || '');
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
      setMessages([]);
    }
  };

  const saveConversation = async (messages: CoreMessage[], model: string) => {
    if (!currentUser) return;

    try {
      const title = messages.length > 0 && messages[0].content
        ? ((messages[0].content as string).length > 50
            ? (messages[0].content as string).slice(0, 50) + '...'
            : (messages[0].content as string))
        : 'New Conversation';

      if (currentConversationId) {
        // Update existing conversation
        await updateConversationMutation.mutateAsync({
          id: currentConversationId,
          updates: { messages, model, title },
          password: currentUser.password // Use user's password for encryption
        });
      } else {
        // Create new conversation
        console.log('Creating new conversation with:', { userId: currentUser.id, title, messages: messages.length, model });
        const newConversation = await createConversationMutation.mutateAsync({
          userId: currentUser.id,
          title,
          messages,
          model,
          password: currentUser.password // Use user's password for encryption
        });
        console.log('New conversation created:', newConversation);
        if (newConversation) {
          setCurrentConversationId(newConversation.id);
          // Update URL with new conversation
          router.push(`/?conversation=${newConversation.id}`, { scroll: false });
          // Force refetch of conversations to update sidebar immediately
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation');
    }
  };

  const handleTogglePin = async () => {
    if (!currentConversationId || !currentUser) return;

    try {
      // Get the current conversation to check its pinned status
      const conversation = await DatabaseService.getConversationById(currentConversationId);
      if (!conversation) return;

      const newPinnedState = !conversation.pinned;

      await updateConversationMutation.mutateAsync({
        id: currentConversationId,
        updates: { pinned: newPinnedState },
        password: currentUser.password
      });

      toast.success(newPinnedState ? "Pinned conversation" : "Unpinned conversation");
    } catch (error) {
      console.error('Error updating conversation pin status:', error);
      toast.error("Failed to update conversation");
    }
  };

  const handleModelChange = async (newModel: string) => {
    onModelChange(newModel);
    if (messages.length > 0) {
      await saveConversation(messages, newModel);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim().length === 0) return;
    if (!currentModel) {
      toast.error("Please select a model first");
      return;
    }

    const newMessages: CoreMessage[] = [
      ...messages,
      { content: input, role: "user" },
    ];

    setMessages(newMessages);
    setInput("");

    try {
      const result = await continueConversation(newMessages, currentModel);

      let assistantMessage = "";
      for await (const content of readStreamableValue(result)) {
        assistantMessage = content as string;
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);
      }

      // Save conversation with the complete messages
      const finalMessages: CoreMessage[] = [
        ...newMessages,
        { role: "assistant", content: assistantMessage }
      ];
      await saveConversation(finalMessages, currentModel);

    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="stretch mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 pb-[8rem] pt-[6rem] md:px-0 md:pt-[4rem] xl:pt-[2rem] relative">

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
          model={currentModel}
          handleModelChange={handleModelChange}
        />
      </div>
    );
  }

  return (
    <div className="stretch mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-[8rem] pt-24 md:px-0 relative">
      {/* Conversation Header */}
      {currentConversationId && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">
              {conversations.find(c => c.id === currentConversationId)?.title || 'Conversation'}
            </h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleTogglePin}>
                <Pin className="h-4 w-4 mr-2" />
                Pin Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {messages.map((m, i) => (
        <div key={i} className={cn("mb-4 p-2", m.role === "user" ? "flex justify-end" : "flex justify-start")}>
          <div className={cn("flex items-start max-w-[80%]", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div
              className={cn(
                "flex size-8 shrink-0 select-none items-center justify-center rounded-lg",
                m.role === "user"
                  ? "border bg-background ml-2"
                  : "bg-nvidia border border-[#628f10] text-primary-foreground mr-2",
              )}>
              {m.role === "user" ? <FaUser /> : <FaBrain />}
            </div>
            <div className="space-y-2 overflow-hidden px-1">
              <MemoizedReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="text-sm">
                {m.content as string}
              </MemoizedReactMarkdown>
            </div>
          </div>
        </div>
      ))}
      <div ref={messageEndRef} />
      <ChatInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        model={currentModel}
        handleModelChange={handleModelChange}
      />
    </div>
  );
}
