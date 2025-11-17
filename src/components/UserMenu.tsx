import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-clients";
import {
  LogOut,
  Settings,
  Moon,
  Sun,
  User,
  UserCog,
  Crown,
  Sparkles,
  Briefcase,
  ShoppingBag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCustomer } from "autumn-js/react";

export function UserMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme, theme } = useTheme();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Only query profile if session is loaded
  // @ts-ignore - Type instantiation is excessively deep
  const profile = useQuery(api.users.getMyProfile, session ? {} : "skip");

  // Detect which section of the app we're in
  const isOnBusinessRoutes = location.pathname.startsWith("/business");
  const isOnConsumerRoutes = location.pathname.startsWith("/consumer");

  // Get subscription status using Autumn's hook
  const { customer } = useCustomer();
  const currentPlan = customer?.products?.find(
    (p: any) => p.status === "active"
  );
  const hasPremium =
    currentPlan && !currentPlan.is_default && currentPlan.id !== "free";

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
  const appSettingsPath =
    profile?.role === "business_owner"
      ? "/business/settings"
      : "/consumer/settings";

  // Show loading state while session is loading
  if (sessionPending) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Plan Indicator Badge */}
      {hasPremium ? (
        <Link to="/account" hash="subscription">
          <Badge
            variant="default"
            className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 cursor-pointer"
          >
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        </Link>
      ) : (
        <Link
          to="/upgrade"
          search={{ success: undefined, canceled: undefined }}
        >
          <Badge
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Upgrade
          </Badge>
        </Link>
      )}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="relative hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session?.user?.image || undefined}
                alt={userName}
              />
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
              <span>
                {profile?.role === "business_owner"
                  ? "Business Settings"
                  : "App Settings"}
              </span>
            </Link>
          </DropdownMenuItem>
          {isOnBusinessRoutes ? (
            // On business routes → show link to consumer account
            <DropdownMenuItem asChild>
              <Link to="/consumer/home" className="cursor-pointer">
                <ShoppingBag className="mr-2 h-4 w-4" />
                <span>Consumer Account</span>
              </Link>
            </DropdownMenuItem>
          ) : isOnConsumerRoutes && profile?.role === "business_owner" ? (
            // On consumer routes with business role → show link to business account
            <DropdownMenuItem asChild>
              <Link to="/business/dashboard" className="cursor-pointer">
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Business Account</span>
              </Link>
            </DropdownMenuItem>
          ) : isOnConsumerRoutes ? (
            // On consumer routes without business role → show create business link
            <DropdownMenuItem asChild>
              <Link
                to="/signup"
                search={{ mode: "business" }}
                className="cursor-pointer"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                <span>Create Business Account</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
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
    </div>
  );
}
