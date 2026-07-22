"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader } from "@/components/ui/loader";
import { useWalletStore } from "@/store/finance/wallet-store";
import { PendingTransactions } from "./components/pending-transactions";
import { useRouter } from "@/i18n/routing";
import { useUserStore } from "@/store/user";
import { useConfigStore } from "@/store/config";
import KycRequiredNotice from "@/components/blocks/kyc/kyc-required-notice";
import DataTable from "@/components/blocks/data-table";
import { columns } from "./columns";
import { useTranslations } from "next-intl";
import { $fetch } from "@/lib/api";
import {
  Plus,
  ArrowUpRight,
  ArrowUpDown,
  DollarSign,
  Loader2,
} from "lucide-react";

type WalletTab = "assets" | "allocation" | "transactions";

const ALLOCATION_COLORS = [
  "#3375BB",
  "#5A9BD4",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
];

const QUICK_ACTIONS = [
  { label: "Deposit", desc: "Add funds to your account", icon: Plus, href: "/finance/deposit" },
  { label: "Withdraw", desc: "Send to external wallet", icon: ArrowUpRight, href: "/finance/withdraw" },
  { label: "Transfer", desc: "Internal account transfer", icon: ArrowUpDown, href: "/finance/transfer" },
  { label: "Stake", desc: "Earn rewards on holdings", icon: DollarSign, href: "/staking" },
];

export function WalletDashboard() {
  const t = useTranslations("finance/wallet/client");
  const { hasKyc, canAccessFeature, user } = useUserStore();
  const { settings } = useConfigStore();
  const router = useRouter();
  const {
    isLoading,
    fetchWallets,
    totalBalance = 0,
    totalChange = 0,
    totalChangePercent = 0,
    fetchStats,
  } = useWalletStore();
  const [activeTab, setActiveTab] = useState<WalletTab>("assets");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const { spotWallets, fiatWallets, ecoWallets, futuresWallets } = useWalletStore();

  useEffect(() => {
    fetchWallets();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "transactions" && transactions.length === 0) {
      setLoadingTx(true);
      $fetch<{ data: any[] }>({
        url: "/api/finance/transaction",
        method: "GET",
        params: { perPage: 10, sortField: "createdAt", sortOrder: "desc" },
        silent: true,
      }).then(({ data }) => {
        if (data?.data) setTransactions(data.data);
        setLoadingTx(false);
      });
    }
  }, [activeTab]);

  const allWallets = useMemo(() => {
    return [
      ...(spotWallets || []),
      ...(fiatWallets || []),
      ...(ecoWallets || []),
      ...(futuresWallets || []),
    ].filter((w: any) => w.balance > 0);
  }, [spotWallets, fiatWallets, ecoWallets, futuresWallets]);

  const availableBalance = useMemo(() => {
    return allWallets.reduce((sum: number, w: any) => sum + (parseFloat(w.balance) || 0), 0);
  }, [allWallets]);

  const allocationData = useMemo(() => {
    if (!allWallets.length) return [];
    const total = allWallets.reduce((s: number, w: any) => s + (parseFloat(w.balance) || 0), 0);
    if (total === 0) return [];
    const sorted = [...allWallets].sort((a: any, b: any) => (parseFloat(b.balance) || 0) - (parseFloat(a.balance) || 0));
    const top = sorted.slice(0, 7);
    const others = sorted.slice(7);
    const othersBalance = others.reduce((s: number, w: any) => s + (parseFloat(w.balance) || 0), 0);
    const items = top.map((w: any, i: number) => ({
      name: w.currency,
      color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
      pct: Math.round(((parseFloat(w.balance) || 0) / total) * 100),
    }));
    if (othersBalance > 0) {
      items.push({ name: "Others", color: ALLOCATION_COLORS[7], pct: Math.round((othersBalance / total) * 100) });
    }
    return items;
  }, [allWallets]);

  const kycEnabled =
    settings?.kycStatus === true || settings?.kycStatus === "true";
  const hasKycApproved = hasKyc();
  const hasWalletFeature = canAccessFeature("view_wallets");

  if (kycEnabled) {
    if (!hasKycApproved || !hasWalletFeature) {
      return <KycRequiredNotice feature="view_wallets" />;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader size="lg" />
          <span className="text-muted-foreground">
            {t("loading_your_wallets")}
          </span>
        </div>
      </div>
    );
  }

  const safeBalance =
    typeof totalBalance === "number" ? totalBalance : 0;
  const safeChange = typeof totalChange === "number" ? totalChange : 0;
  const safeChangePct =
    typeof totalChangePercent === "number" ? totalChangePercent : 0;
  const isPositive = safeChange >= 0;

  return (
    <div className="space-y-4">
      <PendingTransactions />

      {/* Balance overview — 3-column stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Total Balance
          </div>
          <div className="text-[28px] font-extrabold tabular-nums">
            ${safeBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div
            className={`text-sm mt-1 ${isPositive ? "text-success" : "text-destructive"}`}
          >
            {isPositive ? "+" : ""}$
            {Math.abs(safeChange).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}{" "}
            ({safeChangePct.toFixed(1)}%) {isPositive ? "↑" : "↓"}
          </div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Active Wallets
          </div>
          <div className="text-[28px] font-extrabold tabular-nums">
            {allWallets.length}
          </div>
          <div className="text-sm mt-1 text-muted-foreground">
            Wallets with balance
          </div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Currencies
          </div>
          <div className="text-[28px] font-extrabold tabular-nums">
            {new Set(allWallets.map((w: any) => w.currency)).size}
          </div>
          <div className="text-sm mt-1 text-muted-foreground">
            Unique currencies held
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-3 p-3 bg-card border border-border cursor-pointer text-left hover:bg-[hsl(var(--primary)/0.06)] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-[hsl(var(--primary)/0.08)] text-primary shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-[13px]">{action.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {action.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-border">
        {(["assets", "allocation", "transactions"] as WalletTab[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2.5 text-[13px] font-extrabold border-b-2 -mb-[2px] cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 capitalize ${
                activeTab === tab
                  ? "text-primary border-b-primary"
                  : "text-muted-foreground border-b-transparent hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Assets tab — data table */}
      {activeTab === "assets" && (
        <DataTable
          apiEndpoint="/api/finance/wallet"
          model="wallet"
          modelConfig={{ userId: user?.id }}
          pageSize={10}
          canView={true}
          viewLink="/finance/wallet/[type]/[currency]"
          isParanoid={false}
          title="Assets"
          itemTitle="Wallet"
          columns={columns}
        />
      )}

      {/* Allocation tab */}
      {activeTab === "allocation" && (
        <div className="bg-card border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-sm">Portfolio Allocation</span>
          </div>
          {allocationData.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No assets to display. Deposit to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-center">
              <div className="relative w-[180px] h-[180px] mx-auto sm:mx-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    return allocationData.map((item) => {
                      const el = (
                        <circle
                          key={item.name}
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          strokeWidth="3.5"
                          stroke={item.color}
                          strokeDasharray={`${item.pct} ${100 - item.pct}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += item.pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px] font-extrabold">{allocationData.length}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Assets
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {allocationData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 py-2 border-b border-border/40 text-sm"
                  >
                    <div
                      className="w-2.5 h-2.5 shrink-0"
                      style={{ background: item.color }}
                    />
                    <span>{item.name}</span>
                    <span className="ml-auto font-semibold tabular-nums">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === "transactions" && (
        <div className="bg-card border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-sm">Recent Transactions</span>
            <a
              href="/finance/transaction"
              className="text-xs text-primary font-semibold no-underline hover:underline"
            >
              View All
            </a>
          </div>
          {loadingTx ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            transactions.map((tx: any) => {
              const isIncoming = tx.type?.includes("INCOMING") || tx.type?.includes("DEPOSIT");
              const isOutgoing = tx.type?.includes("OUTGOING") || tx.type?.includes("WITHDRAW");
              const badgeClass = isIncoming
                ? "bg-[hsl(160_81%_40%/0.1)] text-success"
                : isOutgoing
                  ? "bg-[hsl(0_84%_60%/0.1)] text-destructive"
                  : "bg-[hsl(var(--primary)/0.1)] text-primary";
              const label = tx.type?.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || "Transaction";
              const status = tx.status?.toLowerCase();

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-[auto_2fr_1fr_1fr] gap-3 py-3 items-center border-b border-border/50 last:border-b-0 text-sm"
                >
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase ${badgeClass}`}>
                    {label.length > 15 ? label.slice(0, 15) : label}
                  </span>
                  <span className="font-semibold">
                    {tx.description || `${tx.amount} ${tx.wallet?.currency || ""}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      status === "completed"
                        ? "text-success"
                        : status === "pending"
                          ? "text-[#F59E0B]"
                          : "text-destructive"
                    }`}
                  >
                    {status === "completed" ? "Completed" : status === "pending" ? "Pending" : status === "failed" ? "Failed" : status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default WalletDashboard;
