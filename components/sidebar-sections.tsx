"use client";

import { MessageSquare, Pin, Clock } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen, faCubes, faPlus, faFile } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useConversations, useUpdateConversation, useDeleteConversation, useProjects, useFiles } from "@/lib/database-hooks";
import { useUser } from "./user-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, FolderPlus } from "lucide-react";

interface SidebarNewChatProps {
  onNewChat: () => void;
}

export function SidebarNewChat({ onNewChat }: SidebarNewChatProps) {
  const handleClick = () => {
    console.log('New Chat button clicked');
    onNewChat();
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <Button
          onClick={handleClick}
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

interface SidebarFilesProps {
  onSeeAll?: () => void;
  onCreateFolder?: () => void;
}

export function SidebarFiles({ onSeeAll, onCreateFolder }: SidebarFilesProps) {
  const { currentUser } = useUser();
  const { data: files = [] } = useFiles(currentUser?.id || '');

  // Show only root level files (no parent folder)
  const rootFiles = files.filter(file => !file.parentId).slice(0, 3); // Limit to 3

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span>Files</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={onSeeAll}
        >
          See All
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {rootFiles.length > 0 ? (
            rootFiles.map((file) => (
              <SidebarMenuItem key={file.id}>
                <SidebarMenuButton disabled>
                  <FontAwesomeIcon icon={file.type === 'folder' ? faFolderOpen : faFile} className="w-4 h-4" />
                  <span className="truncate">{file.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <FontAwesomeIcon icon={faFolderOpen} className="w-4 h-4" />
                <span className="text-muted-foreground">No files uploaded</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface SidebarProjectsProps {
  onSeeAll?: () => void;
  onCreateProject?: () => void;
}

export function SidebarProjects({ onSeeAll, onCreateProject }: SidebarProjectsProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span>Projects</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={onSeeAll}
        >
          See All
        </Button>
      </SidebarGroupLabel>
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
  onSeeAll?: (type: 'pinned' | 'recent') => void;
  onAddToProject?: (conversationId: string) => void;
}

export function SidebarPinnedChats({ onSelectConversation, currentConversationId, onSeeAll, onAddToProject }: SidebarChatsProps) {
  const { currentUser } = useUser();
  const { data: conversations = [] } = useConversations(currentUser?.id || '');
  const { data: projects = [] } = useProjects(currentUser?.id || '');
  const updateConversationMutation = useUpdateConversation();
  const deleteConversationMutation = useDeleteConversation();

  // Filter only pinned conversations
  const pinnedConversations = conversations.filter(conv => conv.pinned);

  const handleTogglePin = async (conversationId: string, currentlyPinned: boolean) => {
    if (!currentUser) return;
    
    try {
      await updateConversationMutation.mutateAsync({
        id: conversationId,
        updates: { pinned: !currentlyPinned },
        password: currentUser.password
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  const handleDeleteChat = async (conversationId: string) => {
    if (!currentUser) return;
    
    try {
      await deleteConversationMutation.mutateAsync({
        id: conversationId,
        password: currentUser.password
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <span>Pinned Chats</span>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {pinnedConversations.length > 0 ? (
            pinnedConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id} className="group relative">
                <SidebarMenuButton
                  onClick={() => onSelectConversation(conversation.id)}
                  isActive={currentConversationId === conversation.id}
                  className="pr-8"
                >
                  <Pin className="h-4 w-4" />
                  <span className="truncate">{conversation.title}</span>
                </SidebarMenuButton>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleTogglePin(conversation.id, conversation.pinned || false)}>
                        <Pin className="h-4 w-4 mr-2" />
                        {conversation.pinned ? 'Unpin Chat' : 'Pin Chat'}
                      </DropdownMenuItem>
                      {projects.length > 0 && (
                        <DropdownMenuItem onClick={() => onAddToProject?.(conversation.id)}>
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Add to Project
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteChat(conversation.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
}export function SidebarRecentChats({ onSelectConversation, currentConversationId, onSeeAll, onAddToProject }: SidebarChatsProps) {
  const { currentUser } = useUser();
  const { data: conversations = [] } = useConversations(currentUser?.id || '');
  const { data: projects = [] } = useProjects(currentUser?.id || '');
  const updateConversationMutation = useUpdateConversation();
  const deleteConversationMutation = useDeleteConversation();

  // Recent conversations (excluding pinned ones) - show all, not limited
  const recentConversations = conversations.filter(conv => !conv.pinned);
  
  console.log('SidebarRecentChats - conversations:', conversations.length, 'recent:', recentConversations.length);

  const handleTogglePin = async (conversationId: string, currentlyPinned: boolean) => {
    if (!currentUser) return;
    
    try {
      await updateConversationMutation.mutateAsync({
        id: conversationId,
        updates: { pinned: !currentlyPinned },
        password: currentUser.password
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  const handleDeleteChat = async (conversationId: string) => {
    if (!currentUser) return;
    
    try {
      await deleteConversationMutation.mutateAsync({
        id: conversationId,
        password: currentUser.password
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <span>Recent Chats</span>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentConversations.length > 0 ? (
            recentConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id} className="group relative">
                <SidebarMenuButton
                  onClick={() => onSelectConversation(conversation.id)}
                  isActive={currentConversationId === conversation.id}
                  className="pr-8"
                >
                  <Clock className="h-4 w-4" />
                  <span className="truncate">{conversation.title}</span>
                </SidebarMenuButton>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleTogglePin(conversation.id, conversation.pinned || false)}>
                        <Pin className="h-4 w-4 mr-2" />
                        {conversation.pinned ? 'Unpin Chat' : 'Pin Chat'}
                      </DropdownMenuItem>
                      {projects.length > 0 && (
                        <DropdownMenuItem onClick={() => onAddToProject?.(conversation.id)}>
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Add to Project
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteChat(conversation.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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