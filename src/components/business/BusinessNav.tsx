import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function BusinessNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const isDashboard = pathname === "/business/dashboard";
  const isPrograms = pathname.startsWith("/business/programs");
  const isSettings = pathname === "/business/settings";

  // Show main navigation for all business pages
  return (
    <nav className="fixed bottom-6 left-0 right-0 z-100 pointer-events-none">
      <div className="flex justify-center px-4">
        <div className="pointer-events-auto bg-background/80 backdrop-blur-lg border shadow-lg rounded-full px-2 py-2 flex items-center gap-1">
          <Link
            to="/business/dashboard"
            className="flex items-center justify-center transition-all px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap hover:bg-accent/50 relative"
          >
            {isDashboard && (
              <motion.div
                layoutId="business-nav-highlight"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <span
              className={`relative z-10 ${
                isDashboard ? "text-primary-foreground" : ""
              }`}
            >
              Dashboard
            </span>
          </Link>
          <Link
            to="/business/programs"
            className="flex items-center justify-center transition-all px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap hover:bg-accent/50 relative"
          >
            {isPrograms && (
              <motion.div
                layoutId="business-nav-highlight"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <span
              className={`relative z-10 ${
                isPrograms ? "text-primary-foreground" : ""
              }`}
            >
              Programs
            </span>
          </Link>
          <Link
            to="/business/settings"
            className="flex items-center justify-center transition-all px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap hover:bg-accent/50 relative"
          >
            {isSettings && (
              <motion.div
                layoutId="business-nav-highlight"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <span
              className={`relative z-10 ${
                isSettings ? "text-primary-foreground" : ""
              }`}
            >
              Settings
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
