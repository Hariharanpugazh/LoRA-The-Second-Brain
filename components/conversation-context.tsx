"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ConversationContextType {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  return (
    <ConversationContext.Provider value={{
      currentConversationId,
      setCurrentConversationId
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}