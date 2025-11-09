import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-clients";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ConsumerLayoutProps {
  children: React.ReactNode;
}

export function ConsumerLayout({ children }: ConsumerLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ 
      to: "/login",
      search: {
        redirect: "/app",
      },
    });
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-4 px-6 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold">No Punch Cards</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/consumer/notifications">
            <button className="relative hover:opacity-70 transition-opacity">
              <Bell className="w-5 h-5" />
              {/* Notification badge would go here */}
            </button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

