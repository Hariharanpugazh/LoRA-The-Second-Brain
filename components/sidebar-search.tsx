"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { useState } from "react";

export function SidebarSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 bg-sidebar-accent/50 border-sidebar-border focus:bg-sidebar-accent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}