"use client";

import { ReactNode } from "react";
import Nav from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Login } from "@/components/login";
import { useUser } from "@/components/user-context";

interface AppContentProps {
  children: ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const { isAuthenticated } = useUser();

  const handleLogin = () => {
    // Force a re-render by triggering state update
    window.location.reload();
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Nav />
        <Toaster position={"top-center"} richColors />
        {children}
        <Analytics />
      </SidebarInset>
    </SidebarProvider>
  );
}