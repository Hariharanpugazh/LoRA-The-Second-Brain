"use client";

import Chat from "@/components/chat";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useConversation } from "@/components/conversation-context";

export default function Home() {
  const searchParams = useSearchParams();
  const { setCurrentConversationId } = useConversation();

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setCurrentConversationId(conversationId);
    } else {
      setCurrentConversationId(null);
    }
  }, [searchParams, setCurrentConversationId]);

  return (
    <main className="flex flex-col items-center justify-between">
      <Chat />
    </main>
  );
}
