import Link from "next/link";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { useUser } from "./user-context";
import { ModelSelector } from "./model-selector";

type NavProps = {
  currentModel: string;
  onModelChange: (model: string) => void;
};

export default function Nav({ currentModel, onModelChange }: NavProps) {
  const { currentUser } = useUser();

  return (
    <nav className="fixed flex w-full items-center bg-background p-6 md:bg-transparent z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-8 w-8" />
     us   <ModelSelector currentModel={currentModel} onModelChange={onModelChange} />
      </div>

      {/* Fixed right side elements */}
      <div className="fixed right-6 top-6 flex items-center gap-2">
        {/* Make sure toggler has consistent height */}
        <div className="flex items-center">
          <AnimatedThemeToggler className="h-10 w-10" />
        </div>

        <Link href="/profile">
          <Avatar className="cursor-pointer h-10 w-10">
            <AvatarImage src="/avatars/user.jpg" alt={currentUser?.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </nav>
  );
}
