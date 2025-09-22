"use client";

import { MessageSquare, Pin, Clock } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen, faCubes, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useConversations } from "@/lib/database-hooks";
import { useUser } from "./user-context";

interface SidebarNewChatProps {
  onNewChat: () => void;
}

export function SidebarNewChat({ onNewChat }: SidebarNewChatProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
          variant="ghost"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          New Chat
        </Button>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function SidebarFiles() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Files</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <FontAwesomeIcon icon={faFolderOpen} className="w-4 h-4" />
              <span className="text-muted-foreground">No files uploaded</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function SidebarProjects() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <FontAwesomeIcon icon={faCubes} className="w-4 h-4" />
              <span className="text-muted-foreground">No projects created</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface SidebarChatsProps {
  onSelectConversation: (conversationId: string) => void;
  currentConversationId: string | null;
}

export function SidebarPinnedChats({ onSelectConversation, currentConversationId }: SidebarChatsProps) {
  const { currentUser } = useUser();
  const { data: conversations = [] } = useConversations(currentUser?.id || '');

  // For now, let's consider the first 2 conversations as pinned
  const pinnedConversations = conversations.slice(0, 2);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Pinned Chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {pinnedConversations.length > 0 ? (
            pinnedConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton
                  onClick={() => onSelectConversation(conversation.id)}
                  isActive={currentConversationId === conversation.id}
                >
                  <Pin className="h-4 w-4" />
                  <span className="truncate">{conversation.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Pin className="h-4 w-4" />
                <span className="text-muted-foreground">No pinned chats</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function SidebarRecentChats({ onSelectConversation, currentConversationId }: SidebarChatsProps) {
  const { currentUser } = useUser();
  const { data: conversations = [] } = useConversations(currentUser?.id || '');

  // Recent conversations (excluding pinned ones)
  const recentConversations = conversations.slice(2, 7); // Show next 5 after pinned

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentConversations.length > 0 ? (
            recentConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton
                  onClick={() => onSelectConversation(conversation.id)}
                  isActive={currentConversationId === conversation.id}
                >
                  <Clock className="h-4 w-4" />
                  <span className="truncate">{conversation.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Clock className="h-4 w-4" />
                <span className="text-muted-foreground">No recent chats</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}