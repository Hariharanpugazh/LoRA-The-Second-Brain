"use client";

import React, { ReactNode, useState, createContext, useContext } from "react";
import Nav from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Login } from "@/components/login";
import { useUser } from "@/components/user-context";
import { ConversationProvider, useConversation } from "@/components/conversation-context";

// Create a context for model state
const ModelContext = createContext<{
  currentModel: string;
  onModelChange: (model: string) => void;
}>({
  currentModel: '',
  onModelChange: () => {},
});

export const useModel = () => useContext(ModelContext);

interface AppContentProps {
  children: ReactNode;
}

function AppContentInner({ children }: AppContentProps) {
  const { isAuthenticated, isLoading } = useUser();
  const { currentConversationId, setCurrentConversationId } = useConversation();
  const [currentModel, setCurrentModel] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedModel');
      return stored || '';
    }
    return '';
  });

  // Initialize sidebar state from cookie
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sidebar_state='));
      return cookie ? cookie.split('=')[1] === 'true' : true; // Default to true if no cookie
    }
    return true;
  });

  const handleLogin = () => {
    // Login completed, component will re-render naturally due to state change
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedModel', model);
    }
  };

  // Show loading state while determining authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading LoRA...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ModelContext.Provider value={{ currentModel, onModelChange: handleModelChange }}>
      <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          currentConversationId={currentConversationId}
        />
        <SidebarInset>
          <Nav />
          <Toaster position={"top-center"} richColors />
          {children}
          <Analytics />
        </SidebarInset>
      </SidebarProvider>
    </ModelContext.Provider>
  );
}

export function AppContent({ children }: AppContentProps) {
  return (
    <ConversationProvider>
      <AppContentInner>{children}</AppContentInner>
    </ConversationProvider>
  );
}