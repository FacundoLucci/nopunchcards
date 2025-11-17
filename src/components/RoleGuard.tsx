import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

type Role = "consumer" | "business_owner" | "admin";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  redirectTo: string;
}

/**
 * Client-side role guard using cached Convex queries
 * - No server round-trips after initial load
 * - Uses Convex's reactive cache
 * - Instant navigation
 */
export function RoleGuard({
  children,
  allowedRoles,
  redirectTo,
}: RoleGuardProps) {
  const navigate = useNavigate();
  const roleInfo = useQuery(api.users.roleCheck.checkUserRole, {});

  useEffect(() => {
    // If no role info, user needs to complete onboarding
    if (roleInfo === null) {
      navigate({ to: "/consumer/onboarding", replace: true });
      return;
    }

    // Check if user's role is allowed
    if (roleInfo && !allowedRoles.includes(roleInfo.role)) {
      navigate({ to: redirectTo, replace: true });
    }
  }, [roleInfo, allowedRoles, redirectTo, navigate]);

  // Show loading state only on initial load
  if (roleInfo === undefined) {
    return null; // Or a loading spinner
  }

  // Don't render if redirecting
  if (roleInfo === null || !allowedRoles.includes(roleInfo.role)) {
    return null;
  }

  return <>{children}</>;
}

