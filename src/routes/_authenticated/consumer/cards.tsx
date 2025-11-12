import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/consumer/cards")({
  // Client-side rendering for instant navigation
  ssr: false,
  component: CardsPage,
});

function CardsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 text-muted-foreground">
          Loading your cards...
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-8">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Cards</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your linked payment methods
          </p>
        </div>

        {/* Card Stack */}
        <CardsSection />
      </div>
    </Suspense>
  );
}

function CardsSection() {
  const { data: accounts } = useSuspenseQuery(
    convexQuery(api.consumer.accounts.listLinkedAccounts, {})
  );
  const createLinkToken = useAction(api.plaid.linkToken.createLinkToken);
  const exchangeToken = useAction(api.plaid.exchangeToken.exchangePublicToken);
  const [linking, setLinking] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleAddCard = async () => {
    if (linking) return;

    setLinking(true);
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
          setLinking(false);
        },
      });

      handler.open();
    } catch (error) {
      toast.error("Failed to start Plaid Link");
      setLinking(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="space-y-4 max-w-[320px] mx-auto">
        <EmptyCardPlaceholder />
        <Button
          onClick={handleAddCard}
          disabled={linking}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {linking ? "Opening Plaid..." : "Link Your First Card"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Stack - constrained width for better proportions */}
      <div className="relative min-h-[220px] sm:min-h-[240px] max-w-[320px] mx-auto">
        <AnimatePresence>
          {accounts.map((account, index) => (
            <CreditCardComponent
              key={account._id}
              account={account}
              index={index}
              totalCards={accounts.length}
              isExpanded={expandedCard === account._id}
              onToggleExpand={() =>
                setExpandedCard(
                  expandedCard === account._id ? null : account._id
                )
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add Card Button */}
      <div className="max-w-[320px] mx-auto">
        <Button
          onClick={handleAddCard}
          disabled={linking}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {linking ? "Opening Plaid..." : "Add Another Card"}
        </Button>
      </div>
    </div>
  );
}

interface CreditCardProps {
  account: {
    _id: string;
    institutionName?: string;
    accountIds: string[];
    status: "active" | "disconnected" | "error";
    lastSyncedAt?: number;
    createdAt: number;
  };
  index: number;
  totalCards: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function CreditCardComponent({
  account,
  index,
  totalCards,
  isExpanded,
  onToggleExpand,
}: CreditCardProps) {
  // Generate a unique gradient for each institution
  const gradients = [
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-emerald-500 via-teal-500 to-cyan-500",
    "from-orange-500 via-red-500 to-pink-500",
    "from-blue-500 via-indigo-500 to-purple-500",
    "from-amber-500 via-orange-500 to-red-500",
  ];

  const gradient = gradients[index % gradients.length];

  // Calculate card offset in stack
  const stackOffset = isExpanded ? 0 : index * 12;
  const zIndex = totalCards - index;

  // Format last sync date
  const lastSyncText = account.lastSyncedAt
    ? new Date(account.lastSyncedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

  // Get status color
  const statusColor =
    account.status === "active"
      ? "text-emerald-400"
      : account.status === "error"
        ? "text-red-400"
        : "text-gray-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: isExpanded ? index * 280 : stackOffset,
        scale: isExpanded ? 1 : 1 - index * 0.02,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      onClick={onToggleExpand}
      className="absolute inset-x-0 cursor-pointer select-none"
      style={{ zIndex }}
    >
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-xl overflow-hidden`}
      >
        {/* Card Pattern/Texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

        {/* Card Content */}
        <div className="relative h-full flex flex-col justify-between text-white">
          {/* Top Section - Bank Name & Logo */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">
                {account.institutionName || "Bank Account"}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    account.status === "active"
                      ? "bg-emerald-400"
                      : account.status === "error"
                        ? "bg-red-400"
                        : "bg-gray-400"
                  }`}
                />
                <span className={`text-xs ${statusColor} capitalize`}>
                  {account.status}
                </span>
              </div>
            </div>
            <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
          </div>

          {/* Middle Section - Card Number (masked) */}
          <div className="space-y-1">
            <div className="flex gap-3 sm:gap-4 font-mono text-base sm:text-lg tracking-wider">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span className="font-semibold">
                {account.accountIds[0]?.slice(-4) || "0000"}
              </span>
            </div>
            {account.accountIds.length > 1 && (
              <p className="text-xs opacity-75">
                +{account.accountIds.length - 1} more account
                {account.accountIds.length > 2 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Bottom Section - Dates & Info */}
          <div className="flex items-end justify-between text-xs sm:text-sm">
            <div>
              <p className="opacity-75 text-xs mb-1">Last Synced</p>
              <p className="font-medium">{lastSyncText}</p>
            </div>
            <div className="text-right">
              <p className="opacity-75 text-xs mb-1">Linked</p>
              <p className="font-medium">
                {new Date(account.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}

function EmptyCardPlaceholder() {
  return (
    <div className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 p-6 shadow-xl overflow-hidden border-2 border-dashed border-gray-400 dark:border-gray-600">
      {/* Card Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

      {/* Empty State Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
        <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 mb-3 opacity-50" />
        <p className="font-medium text-sm sm:text-base">No cards linked yet</p>
        <p className="text-xs sm:text-sm mt-1 opacity-75">
          Link a card to start earning rewards
        </p>
      </div>
    </div>
  );
}

