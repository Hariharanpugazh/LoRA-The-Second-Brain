"use client";

import * as React from "react";
import { GalleryVerticalEnd, AudioWaveform } from "lucide-react";

import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { SidebarSearch } from "@/components/sidebar-search";
import {
  SidebarNewChat,
  SidebarFiles,
  SidebarProjects,
  SidebarPinnedChats,
  SidebarRecentChats
} from "@/components/sidebar-sections";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "LoRA User",
    email: "user@lora.ai",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "LoRA - The Second Brain",
      logo: GalleryVerticalEnd,
      plan: "",
    },
    {
      name: "Personal",
      logo: AudioWaveform,
      plan: "Free",
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNewChat?: () => void;
  onSelectConversation?: (conversationId: string) => void;
  currentConversationId?: string | null;
  onSeeAllChats?: (type: 'pinned' | 'recent') => void;
  onSeeAllFiles?: () => void;
  onCreateFolder?: () => void;
  onSeeAllProjects?: () => void;
  onCreateProject?: () => void;
}

export function AppSidebar({
  onNewChat = () => {},
  onSelectConversation = () => {},
  currentConversationId = null,
  onSeeAllChats = () => {},
  onSeeAllFiles = () => {},
  onCreateFolder = () => {},
  onSeeAllProjects = () => {},
  onCreateProject = () => {},
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* Search bar at top */}
        <SidebarSearch />

        {/* New Chat */}
        <SidebarNewChat onNewChat={onNewChat} />

        {/* Files */}
        <SidebarFiles
          onSeeAll={onSeeAllFiles}
          onCreateFolder={onCreateFolder}
        />

        {/* Projects */}
        <SidebarProjects
          onSeeAll={onSeeAllProjects}
          onCreateProject={onCreateProject}
        />

        {/* Pinned Chats */}
        <SidebarPinnedChats
          onSelectConversation={onSelectConversation}
          currentConversationId={currentConversationId}
          onSeeAll={onSeeAllChats}
        />

        {/* Recent Chats */}
        <SidebarRecentChats
          onSelectConversation={onSelectConversation}
          currentConversationId={currentConversationId}
          onSeeAll={onSeeAllChats}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}