"use client";

import { useEffect, useState } from "react";
import {
  PiggyBank,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  useSavingsStore,
  type SavingsVault,
  type SavingsDeposit,
} from "@/store/savings/savings-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

const DEFAULT_VAULTS: SavingsVault[] = [
  {
    id: "vault-safe-haven",
    name: "Safe Haven",
    description:
      "Low-risk stablecoin vault with guaranteed returns. Ideal for capital preservation.",
    currency: "USDT",
    apy: 4,
    minDeposit: 10,
    maxDeposit: 100000,
    lockPeriodDays: 30,
    riskLevel: "LOW",
    totalDeposited: 0,
    status: "ACTIVE",
  },
  {
    id: "vault-growth-fund",
    name: "Growth Fund",
    description:
      "Balanced risk vault with diversified stablecoin strategies for steady growth.",
    currency: "USDC",
    apy: 8,
    minDeposit: 50,
    maxDeposit: 250000,
    lockPeriodDays: 90,
    riskLevel: "MEDIUM",
    totalDeposited: 0,
    status: "ACTIVE",
  },
  {
    id: "vault-alpha",
    name: "Alpha Vault",
    description:
      "High-yield vault leveraging DeFi strategies for maximum returns. Higher risk.",
    currency: "USDT",
    apy: 12,
    minDeposit: 100,
    maxDeposit: 500000,
    lockPeriodDays: 180,
    riskLevel: "HIGH",
    totalDeposited: 0,
    status: "ACTIVE",
  },
  {
    id: "vault-flexi",
    name: "Flexi Saver",
    description:
      "No lock period — withdraw anytime. Lower APY but full flexibility.",
    currency: "USDT",
    apy: 2.5,
    minDeposit: 5,
    maxDeposit: 50000,
    lockPeriodDays: 0,
    riskLevel: "LOW",
    totalDeposited: 0,
    status: "ACTIVE",
  },
];

const RISK_CONFIG: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "bg-success/[0.08]", text: "text-success" },
  MEDIUM: { bg: "bg-warning/[0.08]", text: "text-warning" },
  HIGH: { bg: "bg-destructive/[0.08]", text: "text-destructive" },
};

const DEPOSIT_STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-success/[0.08]", text: "text-success" },
  MATURED: { bg: "bg-primary/[0.08]", text: "text-primary" },
  WITHDRAWN: { bg: "bg-muted", text: "text-muted-foreground" },
};

export default function SavingsClient() {
  const { user } = useUserStore();
  const {
    vaults,
    deposits,
    isLoading,
    isDepositing,
    totalEarned,
    totalDeposited,
    fetchVaults,
    fetchDeposits,
    deposit,
    withdraw,
  } = useSavingsStore();

  const [selectedVault, setSelectedVault] = useState<SavingsVault | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVaults();
      fetchDeposits();
    }
  }, [user]);

  const displayVaults =
    vaults.length > 0 ? vaults.filter((v) => v.status === "ACTIVE") : DEFAULT_VAULTS;

  const activeDeposits = deposits.filter((d) => d.status === "ACTIVE");

  const dailyEarnings = activeDeposits.reduce(
    (sum, d) => sum + (d.dailyEarnings || 0),
    0
  );

  const handleDeposit = async () => {
    if (!selectedVault || !depositAmount) return;
    const result = await deposit({
      vaultId: selectedVault.id,
      amount: parseFloat(depositAmount),
      currency: selectedVault.currency,
    });
    if (result.success) {
      setDepositAmount("");
      setShowDepositModal(false);
      setSelectedVault(null);
      fetchDeposits();
    }
  };

  const handleWithdraw = async (depositId: string) => {
    const result = await withdraw(depositId);
    if (result.success) {
      fetchDeposits();
    }
  };

  const openDepositModal = (vault: SavingsVault) => {
    setSelectedVault(vault);
    setDepositAmount("");
    setShowDepositModal(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Savings Vaults
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Earn yield on your stablecoins — up to 12% APY
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Deposited
              </span>
            </div>
            <div className="text-[20px] font-extrabold tabular-nums">
              ${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Earned
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success tabular-nums">
              ${totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Daily Earnings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[20px] font-extrabold text-success tabular-nums">
                ${dailyEarnings.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </div>
              {dailyEarnings > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 bg-success" />
                </span>
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Active Deposits
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {activeDeposits.length}
            </div>
          </div>
        </div>

        {/* Daily Earnings Banner */}
        {dailyEarnings > 0 && (
          <div className="bg-success/[0.06] border border-success/20 p-4 flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full bg-success opacity-75" />
              <span className="relative inline-flex h-3 w-3 bg-success" />
            </span>
            <div>
              <span className="text-[14px] font-extrabold text-success tabular-nums">
                +${dailyEarnings.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </span>
              <span className="text-[13px] text-muted-foreground ml-2">
                earned today across {activeDeposits.length} active deposit
                {activeDeposits.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            {/* Available Vaults */}
            <div>
              <h2 className="text-[18px] font-bold mb-4">Available Vaults</h2>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card border border-border p-5 animate-pulse">
                      <div className="h-5 bg-muted w-1/2 mb-3" />
                      <div className="h-10 bg-muted w-1/3 mb-3" />
                      <div className="h-4 bg-muted w-full mb-2" />
                      <div className="h-4 bg-muted w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayVaults.map((vault) => {
                    const risk = RISK_CONFIG[vault.riskLevel] || RISK_CONFIG.LOW;
                    return (
                      <div key={vault.id} className="bg-card border border-border p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-[15px] font-extrabold">
                              {vault.name}
                            </h3>
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              {vault.currency}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase ${risk.bg} ${risk.text}`}
                          >
                            {vault.riskLevel}
                          </span>
                        </div>

                        <div className="text-[32px] font-extrabold text-success tabular-nums leading-none mb-2">
                          {vault.apy}%
                          <span className="text-[12px] font-bold text-muted-foreground ml-1">
                            APY
                          </span>
                        </div>

                        <p className="text-[12px] text-muted-foreground mb-4 line-clamp-2">
                          {vault.description}
                        </p>

                        <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground mb-4">
                          <div className="flex justify-between">
                            <span>Min Deposit</span>
                            <span className="font-semibold text-foreground tabular-nums">
                              ${vault.minDeposit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Deposit</span>
                            <span className="font-semibold text-foreground tabular-nums">
                              ${vault.maxDeposit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lock Period</span>
                            <span className="font-semibold text-foreground">
                              {vault.lockPeriodDays > 0
                                ? `${vault.lockPeriodDays} days`
                                : "Flexible"}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => openDepositModal(vault)}
                          className="w-full py-2.5 text-[13px] font-extrabold bg-primary text-white border-none cursor-pointer hover:bg-[#2a619e] transition-colors"
                        >
                          Deposit
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Deposit Modal */}
            {showDepositModal && selectedVault && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-card border border-border p-6 w-full max-w-md mx-4">
                  <h3 className="text-[18px] font-extrabold mb-1">
                    Deposit to {selectedVault.name}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    {selectedVault.apy}% APY &middot; {selectedVault.currency} &middot;{" "}
                    {selectedVault.lockPeriodDays > 0
                      ? `${selectedVault.lockPeriodDays}-day lock`
                      : "Flexible"}
                  </p>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                      Amount ({selectedVault.currency})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`Min $${selectedVault.minDeposit}`}
                      className="w-full px-3.5 py-3 text-lg font-extrabold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                    />
                    <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
                      <span>Min: ${selectedVault.minDeposit.toLocaleString()}</span>
                      <span>Max: ${selectedVault.maxDeposit.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => {
                        setShowDepositModal(false);
                        setSelectedVault(null);
                      }}
                      className="flex-1 py-2.5 text-[13px] font-bold bg-transparent border border-border text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={isDepositing || !depositAmount}
                      className="flex-1 py-2.5 text-[13px] font-extrabold bg-success text-white border-none cursor-pointer hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isDepositing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Depositing...
                        </>
                      ) : (
                        "Confirm Deposit"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* My Deposits */}
            <div>
              <h2 className="text-[18px] font-bold mb-4">My Deposits</h2>
              {deposits.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {deposits.map((d) => {
                    const sc =
                      DEPOSIT_STATUS_CONFIG[d.status] || DEPOSIT_STATUS_CONFIG.ACTIVE;
                    return (
                      <div
                        key={d.id}
                        className="bg-card border border-border p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-[14px] font-extrabold">
                              {d.vaultName}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                              {d.apy}% APY &middot; {d.currency}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                          <div>
                            <div className="text-muted-foreground mb-0.5">
                              Deposited
                            </div>
                            <div className="font-extrabold tabular-nums">
                              ${d.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">
                              Earned
                            </div>
                            <div className="font-extrabold text-success tabular-nums">
                              +${d.earned.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">
                              Daily
                            </div>
                            <div className="font-semibold text-success tabular-nums">
                              +${d.dailyEarnings.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">
                              Maturity
                            </div>
                            <div className="font-semibold">
                              {formatDate(d.maturityDate)}
                            </div>
                          </div>
                        </div>
                        {d.status === "ACTIVE" && (
                          <button
                            onClick={() => handleWithdraw(d.id)}
                            className="mt-3 px-4 py-2 text-[12px] font-bold bg-transparent border border-border text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-card border border-border p-8 text-center">
                  <PiggyBank className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] font-semibold">No deposits yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Choose a vault above to start earning yield.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Risk Explainer */}
            <h2 className="text-[18px] font-bold">Understanding Risk</h2>
            <div className="bg-card border border-border p-4">
              <div className="flex flex-col gap-3">
                {[
                  {
                    level: "LOW",
                    label: "Low Risk",
                    description:
                      "Capital preservation focus. Conservative strategies with stable, predictable returns.",
                    icon: Shield,
                  },
                  {
                    level: "MEDIUM",
                    label: "Medium Risk",
                    description:
                      "Balanced approach. Diversified DeFi strategies with moderate volatility.",
                    icon: TrendingUp,
                  },
                  {
                    level: "HIGH",
                    label: "High Risk",
                    description:
                      "Aggressive yield farming. Higher potential returns with increased exposure.",
                    icon: ArrowUpRight,
                  },
                ].map((r) => {
                  const rc = RISK_CONFIG[r.level];
                  return (
                    <div key={r.level} className="flex items-start gap-2.5 p-2.5 border border-border">
                      <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${rc.bg}`}>
                        <r.icon className={`w-3.5 h-3.5 ${rc.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold">{r.label}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${rc.bg} ${rc.text}`}>
                            {r.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {r.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Earn While You Sleep */}
            <div className="bg-success/[0.06] border border-success/20 p-4">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-extrabold text-success">
                    Your money earns while you sleep
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Yield is calculated and accrued every second. Earnings are
                    compounded automatically, so your balance grows around the
                    clock.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-3">Vault Stats</h3>
              <div className="flex flex-col gap-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Vaults</span>
                  <span className="font-bold">{displayVaults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Highest APY</span>
                  <span className="font-bold text-success">
                    {Math.max(...displayVaults.map((v) => v.apy))}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lowest Min Deposit</span>
                  <span className="font-bold">
                    ${Math.min(...displayVaults.map((v) => v.minDeposit))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Active Deposits</span>
                  <span className="font-bold">{activeDeposits.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
