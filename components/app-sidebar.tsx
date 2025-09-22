"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
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
      name: "LoRA Team",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Personal",
      logo: AudioWaveform,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "AI Models",
      url: "#",
      icon: Bot,
      isActive: true,
      items: [
        {
          title: "Local Models",
          url: "#",
        },
        {
          title: "Download Models",
          url: "#",
        },
        {
          title: "Model Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Chats",
      url: "#",
      icon: SquareTerminal,
      items: [
        {
          title: "New Chat",
          url: "#",
        },
        {
          title: "Chat History",
          url: "#",
        },
        {
          title: "Saved Conversations",
          url: "#",
        },
      ],
    },
    {
      title: "Knowledge Base",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Documents",
          url: "#",
        },
        {
          title: "Notes",
          url: "#",
        },
        {
          title: "Import Files",
          url: "#",
        },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: PieChart,
      items: [
        {
          title: "Usage Stats",
          url: "#",
        },
        {
          title: "Performance",
          url: "#",
        },
        {
          title: "Reports",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Privacy",
          url: "#",
        },
        {
          title: "Advanced",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}