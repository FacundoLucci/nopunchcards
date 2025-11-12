import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import { Loader2, User, Mail, Lock, Calendar, ArrowLeft } from "lucide-react";
import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-clients";
import { Link } from "@tanstack/react-router";

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
  const { data: accountInfo } = useSuspenseQuery(
    convexQuery(api.users.getAccountInfo, {})
  );

  const updateName = useMutation(api.users.updateName);

  // Account update states
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
  const backLink = accountInfo?.role === "business_owner" 
    ? "/business/dashboard" 
    : "/consumer/home";

  return (
    <div className="container max-w-4xl py-4 px-4 sm:py-8 sm:px-6 space-y-6">
      <div>
        <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
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
                  <Label htmlFor="current-password" className="text-sm font-normal">
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
                  <Label htmlFor="confirm-password" className="text-sm font-normal">
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
    </div>
  );
}

