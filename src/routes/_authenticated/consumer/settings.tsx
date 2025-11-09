import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, CreditCard, Trash2, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_authenticated/consumer/settings")({
  component: ConsumerSettings,
});

function ConsumerSettings() {
  const navigate = useNavigate();
  const accounts = useQuery(api.consumer.accounts.listLinkedAccounts);
  const disconnectAccount = useMutation(api.consumer.accounts.disconnectAccount);
  const deleteAccount = useMutation(api.consumer.accounts.deleteAccount);
  const createLinkToken = useAction(api.plaid.linkToken.createLinkToken);
  const exchangeToken = useAction(api.plaid.exchangeToken.exchangePublicToken);
  
  const [loadingAccountId, setLoadingAccountId] = useState<Id<"plaidAccounts"> | null>(null);
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
          } catch (error) {
            toast.error("Failed to link card");
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
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your linked cards and account preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Linked Cards</CardTitle>
              <CardDescription className="mt-1.5">
                View and manage your connected bank accounts and cards
              </CardDescription>
            </div>
            <Button onClick={handleAddCard} disabled={linkingNewCard}>
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
          {accounts === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
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
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {account.institutionName || "Bank Account"}
                            </h4>
                            {getStatusBadge(account.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {account.accountIds.length} account{account.accountIds.length !== 1 ? "s" : ""} linked
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {formatDate(account.createdAt)}
                            {account.lastSyncedAt && (
                              <> • Last synced {formatDate(account.lastSyncedAt)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                                <AlertDialogTitle>Disconnect this account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will stop syncing transactions from this account. Your
                                  transaction history will be preserved, but no new transactions
                                  will be tracked.
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
                                <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>
                                    This will permanently delete this account and all associated
                                    transaction history. This action cannot be undone.
                                  </p>
                                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                    <p className="text-sm text-destructive">
                                      Warning: You will lose all reward progress associated with
                                      transactions from this account.
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

      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/consumer/dashboard" })}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

