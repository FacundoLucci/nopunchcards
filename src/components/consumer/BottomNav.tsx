import { Link } from "@tanstack/react-router";
import { Home, Store, Gift } from "lucide-react";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="max-w-[480px] mx-auto flex items-center justify-around py-3">
        <Link 
          to="/consumer/dashboard"
          activeProps={{
            className: "text-primary"
          }}
          className="flex flex-col items-center gap-1 py-2 px-4 hover:bg-accent rounded-md transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Dashboard</span>
        </Link>
        <Link 
          to="/consumer/merchants"
          activeProps={{
            className: "text-primary"
          }}
          className="flex flex-col items-center gap-1 py-2 px-4 hover:bg-accent rounded-md transition-colors"
        >
          <Store className="w-5 h-5" />
          <span className="text-xs">Merchants</span>
        </Link>
        <Link 
          to="/consumer/rewards"
          activeProps={{
            className: "text-primary"
          }}
          className="flex flex-col items-center gap-1 py-2 px-4 hover:bg-accent rounded-md transition-colors"
        >
          <Gift className="w-5 h-5" />
          <span className="text-xs">Rewards</span>
        </Link>
      </div>
    </nav>
  );
}

