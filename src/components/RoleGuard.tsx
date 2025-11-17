import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
  // TypeScript has trouble with deeply nested Convex API types
  // We use a type assertion to work around this
  const ensureProfile = useMutation(
    api.users.ensureProfile.ensureProfileExists as any
  ) as any;
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  useEffect(() => {
    // If no role info and not creating, create a default profile
    if (roleInfo === null && !isCreatingProfile) {
      console.log("[RoleGuard] No profile found - creating default profile");
      setIsCreatingProfile(true);
      
      ensureProfile({})
        .then((result) => {
          console.log("[RoleGuard] Profile created:", result.profileId, "role:", result.role);
          setIsCreatingProfile(false);
          
          // Check if newly created profile has required role
          if (!allowedRoles.includes(result.role)) {
            navigate({ to: redirectTo, replace: true });
          }
        })
        .catch((error) => {
          console.error("[RoleGuard] Failed to create profile:", error);
          // Fallback to onboarding
      navigate({ to: "/consumer/onboarding", replace: true });
        });
      return;
    }

    // Check if user's role is allowed
    if (roleInfo && !allowedRoles.includes(roleInfo.role)) {
      navigate({ to: redirectTo, replace: true });
    }
  }, [roleInfo, allowedRoles, redirectTo, navigate, ensureProfile, isCreatingProfile]);

  // Show loading state only on initial load
  if (roleInfo === undefined || isCreatingProfile) {
    return null; // Or a loading spinner
  }

  // Don't render if redirecting
  if (roleInfo && !allowedRoles.includes(roleInfo.role)) {
    return null;
  }

  return <>{children}</>;
}

