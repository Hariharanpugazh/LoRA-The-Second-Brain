"use client";

import React, { ReactNode, useState } from "react";
import Nav from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Login } from "@/components/login";
import { useUser } from "@/components/user-context";
import { ConversationProvider, useConversation } from "@/components/conversation-context";

interface AppContentProps {
  children: ReactNode;
}

function AppContentInner({ children }: AppContentProps) {
  const { isAuthenticated } = useUser();
  const { currentConversationId, setCurrentConversationId } = useConversation();
  const [currentModel, setCurrentModel] = useState("google/gemma-2-9b-it");

  const handleLogin = () => {
    // Force a re-render by triggering state update
    window.location.reload();
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Clone children with model props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        currentModel,
        onModelChange: handleModelChange,
      } as any);
    }
    return child;
  });

  return (
    <SidebarProvider>
      <AppSidebar
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        currentConversationId={currentConversationId}
      />
      <SidebarInset>
        <Nav currentModel={currentModel} onModelChange={handleModelChange} />
        <Toaster position={"top-center"} richColors />
        {childrenWithProps}
        <Analytics />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppContent({ children }: AppContentProps) {
  return (
    <ConversationProvider>
      <AppContentInner>{children}</AppContentInner>
    </ConversationProvider>
  );
}