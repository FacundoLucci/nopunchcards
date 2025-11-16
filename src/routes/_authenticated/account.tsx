import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCustomer } from "autumn-js/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Calendar,
  ArrowLeft,
  Crown,
  CreditCard,
} from "lucide-react";
import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-clients";
import { Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account")({
  ssr: false,
  component: AccountSettings,
});

function AccountSettings() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const navigate = useNavigate();
  const { data: accountInfo } = useSuspenseQuery(
    convexQuery(api.users.getAccountInfo, {})
  );

  const updateName = useMutation(api.users.updateName);

  // Use Autumn's hooks for subscription management
  const { customer, openBillingPortal } = useCustomer();
  const currentPlan = customer?.products?.find(
    (p: any) => p.status === "active"
  );
  const hasPremium =
    currentPlan && !currentPlan.is_default && currentPlan.id !== "free";

  // Account update states
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingName(true);
    try {
      await updateName({ name: newName.trim() });
      toast.success("Name updated successfully");
      setIsEditingName(false);
      setNewName("");
    } catch (error) {
      toast.error("Failed to update name");
      console.error(error);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to change password");
      } else {
        toast.success("Password changed successfully");
        setIsChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error("Failed to change password");
      console.error(error);
    } finally {
      setSavingPassword(false);
    }
  };

  // Determine back link based on user role
  const backLink =
    accountInfo?.role === "business_owner"
      ? "/business/dashboard"
      : "/consumer/home";

  const handleManageBilling = async () => {
    setOpeningBillingPortal(true);
    try {
      const returnUrl = window.location.origin + "/account#subscription";
      // Use Autumn's openBillingPortal hook
      await openBillingPortal({ returnUrl });
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Failed to open billing portal");
    } finally {
      setOpeningBillingPortal(false);
    }
  };

  return (
    <div className="container max-w-4xl py-4 px-4 sm:py-8 sm:px-6 space-y-6">
      <div>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage your account information and security
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email - Read only */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={accountInfo?.email || ""}
                disabled
                className="bg-muted"
              />
              {accountInfo?.emailVerified && (
                <Badge className="bg-green-500 shrink-0">Verified</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Your email address is used for login and cannot be changed
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Name
            </Label>
            {isEditingName ? (
              <div className="space-y-2">
                <Input
                  id="name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={savingName}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateName}
                    disabled={savingName}
                    size="sm"
                  >
                    {savingName ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName("");
                    }}
                    variant="outline"
                    size="sm"
                    disabled={savingName}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="name"
                    type="text"
                    value={accountInfo?.name || ""}
                    disabled
                    className="bg-muted"
                  />
                  <Button
                    onClick={() => {
                      setNewName(accountInfo?.name || "");
                      setIsEditingName(true);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Account Created */}
          {accountInfo && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Member since{" "}
                  {new Date(accountInfo.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Password
            </Label>
            {isChangingPassword ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="current-password"
                    className="text-sm font-normal"
                  >
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={savingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-normal">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={savingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="text-sm font-normal"
                  >
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={savingPassword}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    size="sm"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    variant="outline"
                    size="sm"
                    disabled={savingPassword}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value="••••••••"
                    disabled
                    className="bg-muted"
                  />
                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    variant="outline"
                    size="sm"
                  >
                    Change
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose a strong password to keep your account secure
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card id="subscription">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPremium && currentPlan ? (
            <>
              {/* Active Premium Subscription */}
              <div className="flex items-start justify-between p-4 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white">
                      {currentPlan.name}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-600 dark:text-green-400"
                    >
                      Active
                    </Badge>
                  </div>
                  {currentPlan.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on{" "}
                      {new Date(
                        currentPlan.current_period_end
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={openingBillingPortal}
                >
                  {openingBillingPortal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Billing
                    </>
                  )}
                </Button>
              </div>

              {/* Additional Options */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/upgrade" })}
                  className="w-full sm:w-auto"
                >
                  View All Plans
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Free Plan / No Subscription */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Free Plan</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You're currently on the free plan. Upgrade to unlock premium
                    features.
                  </p>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={() => navigate({ to: "/upgrade" })}
                  className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/upgrade" })}
                  className="w-full sm:w-auto"
                >
                  View Plans
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
