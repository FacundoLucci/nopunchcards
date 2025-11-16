import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../../convex/_generated/api";
import { Suspense, useState, useMemo } from "react";
import { CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Id } from "../../../../convex/_generated/dataModel";

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
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Cards</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Click the deck to cycle through your cards
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
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Generate random tilts once on mount
  const cardTilts = useMemo(
    () =>
      accounts.map(
        () => Math.random() * 6 - 3 // Random tilt between -3 and 3 degrees
      ),
    [accounts.length]
  );

  if (accounts.length === 0) {
    return (
      <div className="space-y-4 max-w-[320px] mx-auto">
        <EmptyCardPlaceholder />
        <p className="text-center text-sm text-muted-foreground">
          Click "Add Card" below to link your first card
        </p>
      </div>
    );
  }

  const handleCardClick = () => {
    setActiveCardIndex((prev) => (prev + 1) % accounts.length);
  };

  const activeAccount = accounts[activeCardIndex];

  return (
    <div className="space-y-6">
      {/* Card Stack - constrained width for better proportions */}
      <div
        className="relative min-h-[220px] sm:min-h-[240px] max-w-[320px] mx-auto cursor-pointer"
        onClick={handleCardClick}
      >
        <AnimatePresence mode="popLayout">
          {accounts.map((account, index) => {
            const isActive = index === activeCardIndex;
            const offset =
              (index - activeCardIndex + accounts.length) % accounts.length;

            return (
              <CreditCardComponent
                key={account._id}
                account={account}
                index={index}
                offset={offset}
                tilt={cardTilts[index]}
                isActive={isActive}
                totalCards={accounts.length}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Transactions for active card */}
      {activeAccount && <TransactionsList accountId={activeAccount._id} />}
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
  offset: number; // Position relative to active card
  tilt: number; // Random rotation in degrees
  isActive: boolean;
  totalCards: number;
}

function CreditCardComponent({
  account,
  index,
  offset,
  tilt,
  isActive,
  totalCards,
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

  // Calculate z-index: active card on top, then by offset
  const zIndex = isActive ? 100 : totalCards - offset;

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
      initial={{ opacity: 0, y: 20, rotate: 0 }}
      animate={{
        opacity: offset === 0 ? 1 : 0.4 + offset * 0.1, // Active card fully visible
        y: offset * 8, // Stack offset
        scale: offset === 0 ? 1 : 1 - offset * 0.03, // Slight scaling
        rotate: offset === 0 ? 0 : tilt, // Apply random tilt to stacked cards
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="absolute inset-x-0 pointer-events-none select-none"
      style={{ zIndex }}
    >
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl bg-linear-to-br ${gradient} p-4 sm:p-6 overflow-hidden`}
        style={{
          boxShadow: `
            0 1px 0 0 rgba(255, 255, 255, 0.1),
            0 -1px 0 0 rgba(0, 0, 0, 0.1),
            0 20px 60px -10px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Top Edge - crisp highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none rounded-t-3xl"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent)",
          }}
        />

        {/* Bottom Edge - crisp shadow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none rounded-b-3xl"
          style={{
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent)",
          }}
        />

        {/* Side edges for 3D thickness */}
        <div
          className="absolute top-0 bottom-0 left-0 w-px pointer-events-none rounded-l-3xl"
          style={{
            background:
              "linear-gradient(to right, rgba(0, 0, 0, 0.1), transparent)",
          }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-px pointer-events-none rounded-r-3xl"
          style={{
            background:
              "linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent)",
          }}
        />

        {/* Card Pattern/Texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

        {/* Card Content */}
        <div className="relative h-full flex flex-col justify-between text-white">
          {/* Top Section - Bank Name & Logo */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium opacity-90 mb-0.5 sm:mb-1 truncate">
                {account.institutionName || "Bank Account"}
              </p>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    account.status === "active"
                      ? "bg-emerald-400"
                      : account.status === "error"
                      ? "bg-red-400"
                      : "bg-gray-400"
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-xs ${statusColor} capitalize`}
                >
                  {account.status}
                </span>
              </div>
            </div>
            <CreditCard className="w-7 h-7 sm:w-10 sm:h-10 opacity-80 shrink-0 ml-2" />
          </div>

          {/* Middle Section - Card Number (masked) */}
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex gap-2 sm:gap-3 md:gap-4 font-mono text-sm sm:text-base md:text-lg tracking-wider">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span className="font-semibold">
                {account.accountIds[0]?.slice(-4) || "0000"}
              </span>
            </div>
            {account.accountIds.length > 1 && (
              <p className="text-[10px] sm:text-xs opacity-75">
                +{account.accountIds.length - 1} more account
                {account.accountIds.length > 2 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Bottom Section - Dates & Info */}
          <div className="flex items-end justify-between text-[10px] sm:text-xs md:text-sm gap-2">
            <div className="min-w-0 flex-1">
              <p className="opacity-75 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">
                Last Synced
              </p>
              <p className="font-medium truncate">{lastSyncText}</p>
            </div>
            <div className="text-right min-w-0 flex-1">
              <p className="opacity-75 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">
                Linked
              </p>
              <p className="font-medium truncate">
                {new Date(account.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Shine Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}

function EmptyCardPlaceholder() {
  return (
    <div
      className="relative w-full aspect-[1.586/1] rounded-xl bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 p-6 overflow-hidden border-2 border-dashed border-gray-400 dark:border-gray-600"
      style={{
        boxShadow: `
          0 1px 0 0 rgba(255, 255, 255, 0.15),
          0 -1px 0 0 rgba(0, 0, 0, 0.15),
          0 20px 60px -10px rgba(0, 0, 0, 0.2)
        `,
      }}
    >
      {/* Top Edge - crisp highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none rounded-t-3xl"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent)",
        }}
      />

      {/* Bottom Edge - crisp shadow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none rounded-b-2xl"
        style={{
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent)",
        }}
      />

      {/* Side edges for 3D thickness */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[2px] pointer-events-none rounded-l-2xl"
        style={{
          background:
            "linear-gradient(to right, rgba(0, 0, 0, 0.15), transparent)",
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-[2px] pointer-events-none rounded-r-2xl"
        style={{
          background:
            "linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent)",
        }}
      />

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

interface TransactionsListProps {
  accountId: Id<"plaidAccounts">;
}

function TransactionsList({ accountId }: TransactionsListProps) {
  const { data: transactions } = useSuspenseQuery(
    convexQuery(api.consumer.accounts.getAccountTransactions, { accountId })
  );

  if (transactions.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No transactions found for this card</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <TransactionItem key={transaction._id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}

interface TransactionItemProps {
  transaction: {
    _id: Id<"transactions">;
    merchantName?: string;
    businessName?: string;
    amount: number;
    date: string;
    currentVisits?: number;
    totalVisits?: number;
    status: "pending" | "matched" | "unmatched" | "no_match";
  };
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const displayName =
    transaction.businessName || transaction.merchantName || "Unknown Merchant";
  const isMatched = transaction.status === "matched";
  const hasProgress =
    transaction.currentVisits !== undefined &&
    transaction.totalVisits !== undefined;

  // Format amount
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(transaction.amount) / 100);

  // Format date
  const formattedDate = new Date(transaction.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{displayName}</p>
          {isMatched && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              Matched
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
        {hasProgress && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${
                    (transaction.currentVisits! / transaction.totalVisits!) *
                    100
                  }%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {transaction.currentVisits}/{transaction.totalVisits}
            </span>
          </div>
        )}
      </div>
      <div className="ml-4 shrink-0">
        <p className="font-semibold">{formattedAmount}</p>
      </div>
    </div>
  );
}
