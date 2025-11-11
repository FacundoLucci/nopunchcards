import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-clients";
import { LogOut, Settings, Moon, Sun, User, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserMenu() {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  
  // Only query profile if session is loaded
  const profile = useQuery(
    api.users.getMyProfile, 
    session ? {} : "skip"
  );

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({
      to: "/login",
      search: {
        redirect: "/app",
      },
    });
  };

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = session?.user?.name || session?.user?.email || "User";
  const userEmail = session?.user?.email;
  
  // App-specific settings path based on user role
  const appSettingsPath = profile?.role === "business_owner" 
    ? "/business/settings" 
    : "/consumer/settings";
  
  // Show loading state while session is loading
  if (sessionPending) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="relative hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || undefined} alt={userName} />
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer">
            <UserCog className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={appSettingsPath} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{profile?.role === "business_owner" ? "Business Settings" : "App Settings"}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <User className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

