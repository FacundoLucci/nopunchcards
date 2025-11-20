import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, CreditCard, Trash2, Plus, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { OnboardingGuard } from "@/components/OnboardingGuard";

export const Route = createFileRoute("/_authenticated/consumer/settings")({
  ssr: false,
  component: ConsumerSettings,
});

function ConsumerSettings() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      }
    >
      <OnboardingGuard>
        <SettingsContent />
      </OnboardingGuard>
    </Suspense>
  );
}

function SettingsContent() {
  const { data: accounts } = useSuspenseQuery(
    convexQuery(api.consumer.accounts.listLinkedAccounts, {})
  );

  const disconnectAccount = useMutation(
    api.consumer.accounts.disconnectAccount
  );
  const deleteAccount = useMutation(api.consumer.accounts.deleteAccount);
  const createLinkToken = useAction(api.plaid.linkToken.createLinkToken);
  const exchangeToken = useAction(api.plaid.exchangeToken.exchangePublicToken);

  const [loadingAccountId, setLoadingAccountId] =
    useState<Id<"plaidAccounts"> | null>(null);
  const [linkingNewCard, setLinkingNewCard] = useState(false);

  const handleDisconnect = async (accountId: Id<"plaidAccounts">) => {
    setLoadingAccountId(accountId);
    try {
      await disconnectAccount({ accountId });
      toast.success("Account disconnected successfully");
    } catch (error) {
      toast.error("Failed to disconnect account");
      console.error(error);
    } finally {
      setLoadingAccountId(null);
    }
  };

  const handleDelete = async (accountId: Id<"plaidAccounts">) => {
    setLoadingAccountId(accountId);
    try {
      await deleteAccount({ accountId });
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    } finally {
      setLoadingAccountId(null);
    }
  };

  const handleAddCard = async () => {
    setLinkingNewCard(true);
    try {
      const { linkToken } = await createLinkToken({});

      // Initialize Plaid Link
      // @ts-ignore - Plaid Link will be loaded via script tag
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken: string) => {
          try {
            await exchangeToken({ publicToken });
            toast.success("Card linked successfully!");
            setLinkingNewCard(false);
          } catch (error) {
            toast.error("Failed to link card");
            setLinkingNewCard(false);
          }
        },
        onExit: () => {
          setLinkingNewCard(false);
        },
      });

      handler.open();
    } catch (error) {
      toast.error("Failed to start Plaid Link");
      setLinkingNewCard(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: "active" | "disconnected" | "error") => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "disconnected":
        return <Badge variant="secondary">Disconnected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="container max-w-4xl py-4 px-4 sm:py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">App Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage your linked cards and app preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Linked Cards</CardTitle>
              <CardDescription className="mt-1.5">
                View and manage your connected bank accounts and cards
              </CardDescription>
            </div>
            <Button 
              onClick={handleAddCard} 
              disabled={linkingNewCard}
              className="w-full sm:w-auto shrink-0"
              size="sm"
            >
              {linkingNewCard ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Card
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cards linked</h3>
              <p className="text-muted-foreground mb-6">
                Link your first card to start earning rewards automatically
              </p>
              <Button onClick={handleAddCard} disabled={linkingNewCard}>
                {linkingNewCard ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Link Your First Card
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <Card key={account._id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                          <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base">
                              {account.institutionName}
                            </h4>
                            {getStatusBadge(account.status)}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {account.accounts.length} account
                            {account.accounts.length !== 1 ? "s" : ""} linked
                          </p>
                          {account.accounts[0]?.mask && (
                            <p className="text-xs text-muted-foreground">
                              {account.accounts[0].name} (••••{account.accounts[0].mask})
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground break-words">
                            Added {formatDate(account.createdAt)}
                            {account.lastSyncedAt && (
                              <>
                                {" "}
                                • Last synced {formatDate(account.lastSyncedAt)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-col sm:gap-2">
                        {account.status === "active" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={loadingAccountId === account._id}
                              >
                                {loadingAccountId === account._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Disconnect"
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Disconnect this account?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will stop syncing transactions from this
                                  account. Your transaction history will be
                                  preserved, but no new transactions will be
                                  tracked.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDisconnect(account._id)}
                                >
                                  Disconnect
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {account.status === "disconnected" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={loadingAccountId === account._id}
                              >
                                {loadingAccountId === account._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete this account?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>
                                    This will permanently delete this account
                                    and all associated transaction history. This
                                    action cannot be undone.
                                  </p>
                                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                    <p className="text-sm text-destructive">
                                      Warning: You will lose all reward progress
                                      associated with transactions from this
                                      account.
                                    </p>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(account._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
