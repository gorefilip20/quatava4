"use client";

import { useState, useEffect } from "react";
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
import {
  Plus,
  ArrowUpRight,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
} from "lucide-react";

type WalletTab = "assets" | "allocation" | "transactions";

const ALLOCATION_DATA = [
  { name: "Bitcoin", color: "#3375BB", pct: "61%" },
  { name: "Ethereum", color: "#5A9BD4", pct: "12%" },
  { name: "Solana", color: "#10B981", pct: "8%" },
  { name: "Tether", color: "#F59E0B", pct: "6%" },
  { name: "Others", color: "#8B5CF6", pct: "13%" },
];

const TX_DATA = [
  {
    type: "Deposit",
    badge: "bg-[hsl(160_81%_40%/0.1)] text-success",
    desc: "+0.25 BTC",
    value: "$16,960",
    status: "completed" as const,
  },
  {
    type: "Swap",
    badge: "bg-[hsl(var(--primary)/0.1)] text-primary",
    desc: "2.0 ETH → 38 SOL",
    value: "$7,043",
    status: "completed" as const,
  },
  {
    type: "Withdraw",
    badge: "bg-[hsl(0_84%_60%/0.1)] text-destructive",
    desc: "−$1,200 USDT",
    value: "$1,200",
    status: "pending" as const,
  },
  {
    type: "Stake",
    badge: "bg-[hsl(262_83%_58%/0.1)] text-[#8B5CF6]",
    desc: "+0.012 ETH reward",
    value: "$42.26",
    status: "completed" as const,
  },
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

  useEffect(() => {
    fetchWallets();
    fetchStats();
  }, []);

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
            Available Balance
          </div>
          <div className="text-[28px] font-extrabold tabular-nums">
            $98,420.60
          </div>
          <div className="text-sm mt-1 text-muted-foreground">
            Excludes locked & staked
          </div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Staking Rewards (MTD)
          </div>
          <div className="text-[28px] font-extrabold tabular-nums text-success">
            +$342.18
          </div>
          <div className="text-sm mt-1 text-success">APY: 8.2%</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-center">
            {/* SVG donut chart */}
            <div className="relative w-[180px] h-[180px] mx-auto sm:mx-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  strokeWidth="3.5"
                  stroke="#3375BB"
                  strokeDasharray="61 39"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  strokeWidth="3.5"
                  stroke="#5A9BD4"
                  strokeDasharray="12 88"
                  strokeDashoffset="-61"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  strokeWidth="3.5"
                  stroke="#10B981"
                  strokeDasharray="8 92"
                  strokeDashoffset="-73"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  strokeWidth="3.5"
                  stroke="#F59E0B"
                  strokeDasharray="6 94"
                  strokeDashoffset="-81"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  strokeWidth="3.5"
                  stroke="#8B5CF6"
                  strokeDasharray="13 87"
                  strokeDashoffset="-87"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-extrabold">5</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Assets
                </span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-2">
              {ALLOCATION_DATA.map((item) => (
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
                    {item.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === "transactions" && (
        <div className="bg-card border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-sm">Recent Transactions</span>
            <a
              href="#"
              className="text-xs text-primary font-semibold no-underline hover:underline"
            >
              View All →
            </a>
          </div>
          {TX_DATA.map((tx, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_2fr_1fr_1fr] gap-3 py-3 items-center border-b border-border/50 last:border-b-0 text-sm"
            >
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold uppercase ${tx.badge}`}
              >
                {tx.type}
              </span>
              <span className="font-semibold">{tx.desc}</span>
              <span>{tx.value}</span>
              <span
                className={`text-[11px] font-semibold ${
                  tx.status === "completed"
                    ? "text-success"
                    : "text-[#F59E0B]"
                }`}
              >
                {tx.status === "completed" ? "Completed" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WalletDashboard;
