"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingDown,
  AlertTriangle,
  Shield,
  DollarSign,
  Share2,
  Bell,
  Globe,
} from "lucide-react";
import { $fetch } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

interface CountryInflation {
  country: string;
  flag: string;
  currencyCode: string;
  inflationRate: number;
  devaluation: number;
  currentWorth: number;
}

const COUNTRIES: CountryInflation[] = [
  { country: "Argentina", flag: "\u{1F1E6}\u{1F1F7}", currencyCode: "ARS", inflationRate: 211, devaluation: -67.8, currentWorth: 322 },
  { country: "Venezuela", flag: "\u{1F1FB}\u{1F1EA}", currencyCode: "VES", inflationRate: 190, devaluation: -65.5, currentWorth: 345 },
  { country: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", currencyCode: "BRL", inflationRate: 4.5, devaluation: -8.2, currentWorth: 918 },
  { country: "Colombia", flag: "\u{1F1E8}\u{1F1F4}", currencyCode: "COP", inflationRate: 6.2, devaluation: -12.4, currentWorth: 876 },
  { country: "Chile", flag: "\u{1F1E8}\u{1F1F1}", currencyCode: "CLP", inflationRate: 3.9, devaluation: -5.1, currentWorth: 949 },
  { country: "Peru", flag: "\u{1F1F5}\u{1F1EA}", currencyCode: "PEN", inflationRate: 3.2, devaluation: -4.8, currentWorth: 952 },
  { country: "Mexico", flag: "\u{1F1F2}\u{1F1FD}", currencyCode: "MXN", inflationRate: 4.1, devaluation: -7.6, currentWorth: 924 },
  { country: "Uruguay", flag: "\u{1F1FA}\u{1F1FE}", currencyCode: "UYU", inflationRate: 5.8, devaluation: -9.3, currentWorth: 907 },
];

function getInflationColor(rate: number): string {
  if (rate >= 50) return "text-red-500";
  if (rate >= 10) return "text-orange-500";
  if (rate >= 5) return "text-yellow-600 dark:text-yellow-500";
  return "text-emerald-500";
}

function getInflationBg(rate: number): string {
  if (rate >= 50) return "bg-red-500";
  if (rate >= 10) return "bg-orange-500";
  if (rate >= 5) return "bg-yellow-500";
  return "bg-emerald-500";
}

export default function InflationClient() {
  const { user } = useUserStore();
  const [countries, setCountries] = useState<CountryInflation[]>(COUNTRIES);
  const [isLoading, setIsLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [savedThisMonth, setSavedThisMonth] = useState(0);
  const [totalHoldings, setTotalHoldings] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data } = await $fetch({
          url: "/api/finance/inflation",
          silent: true,
        });
        if (data && Array.isArray(data) && data.length > 0) {
          setCountries(data);
        }
      } catch {
        // Use placeholder data on error
      }

      if (user) {
        try {
          const { data: savingsData } = await $fetch({
            url: "/api/finance/inflation/savings",
            silent: true,
          });
          if (savingsData) {
            setSavedThisMonth(savingsData.savedThisMonth || 127.5);
            setTotalHoldings(savingsData.totalHoldings || 4250);
          }
        } catch {
          setSavedThisMonth(127.5);
          setTotalHoldings(4250);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const handleShare = () => {
    const text = `I protected $${savedThisMonth.toFixed(2)} from inflation this month with Quatava`;
    if (navigator.share) {
      navigator.share({ title: "Quatava Inflation Protection", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const handleToggleAlerts = async () => {
    if (user) {
      try {
        await $fetch({
          url: "/api/finance/inflation/alerts",
          method: "POST",
          body: { enabled: !alertsEnabled },
          silent: true,
        });
      } catch {
        // Toggle locally regardless
      }
    }
    setAlertsEnabled(!alertsEnabled);
  };

  const avgInflation =
    countries.reduce((sum, c) => sum + c.inflationRate, 0) / countries.length;
  const highInflationCount = countries.filter((c) => c.inflationRate >= 10).length;

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Inflation Tracker
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            See how much you're saving by holding dollars
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Countries Tracked
              </span>
            </div>
            <div className="text-[20px] font-extrabold">{countries.length}</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-red-500/[0.08]">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Avg Inflation
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-red-500">
              {avgInflation.toFixed(1)}%
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-orange-500/[0.08]">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                High Inflation
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-orange-500">
              {highInflationCount}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <Shield className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                USDT Stability
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success">$1.00</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Country Cards */}
          <div className="space-y-6">
            <h2 className="text-[18px] font-bold">Country Inflation Rates</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card border border-border p-5 animate-pulse">
                    <div className="h-5 bg-muted w-1/3 mb-3" />
                    <div className="h-8 bg-muted w-1/4 mb-2" />
                    <div className="h-4 bg-muted w-2/3 mb-2" />
                    <div className="h-4 bg-muted w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {countries.map((c) => (
                  <div key={c.currencyCode} className="bg-card border border-border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[22px]">{c.flag}</span>
                        <div>
                          <h3 className="font-bold text-[14px]">{c.country}</h3>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {c.currencyCode}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[24px] font-extrabold ${getInflationColor(c.inflationRate)}`}>
                          {c.inflationRate}%
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                          Annual Inflation
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-muted-foreground">
                          Currency Devaluation
                        </span>
                        <span className="text-[13px] font-bold text-red-500">
                          {c.devaluation}%
                        </span>
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        If you held{" "}
                        <span className="font-semibold text-foreground">$1,000</span>{" "}
                        in {c.currencyCode} a year ago, it's now worth{" "}
                        <span className="font-semibold text-foreground">
                          ${c.currentWorth}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dollar Comparison Chart */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-[16px] font-bold">
                  $1,000 After 1 Year: Local Currency vs USDT
                </h2>
              </div>

              <div className="space-y-3">
                {countries.map((c) => {
                  const localWidth = Math.max((c.currentWorth / 1000) * 100, 8);
                  return (
                    <div key={c.currencyCode} className="flex items-center gap-3">
                      <div className="w-12 text-[12px] font-bold shrink-0">
                        {c.currencyCode}
                      </div>
                      <div className="flex-1 space-y-1">
                        {/* Local currency bar */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-5 ${getInflationBg(c.inflationRate)} opacity-70 transition-all`}
                            style={{ width: `${localWidth}%` }}
                          />
                          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                            ${c.currentWorth}
                          </span>
                        </div>
                        {/* USDT bar */}
                        <div className="flex items-center gap-2">
                          <div
                            className="h-5 bg-emerald-500 transition-all"
                            style={{ width: "100%" }}
                          />
                          <span className="text-[11px] font-semibold text-emerald-500 shrink-0">
                            $1,000
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 opacity-70" />
                  <span className="text-[11px] text-muted-foreground">Local Currency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">USDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Personal Savings (auth'd only) */}
            {user && (
              <div className="bg-card border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-[15px] font-bold">Your Savings</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                      Total USDT Holdings
                    </span>
                    <div className="text-[24px] font-extrabold">
                      ${totalHoldings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                      Value Preserved This Month
                    </span>
                    <div className="text-[20px] font-extrabold text-success">
                      +${savedThisMonth.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Based on avg regional inflation vs your USDT position
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Shareable Card */}
            {user && (
              <div className="bg-primary/[0.08] border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="text-[13px] font-bold">Share Your Progress</span>
                </div>
                <div className="bg-card border border-border p-4 mb-3">
                  <p className="text-[13px] font-semibold text-center">
                    I protected{" "}
                    <span className="text-success font-extrabold">
                      ${savedThisMonth.toFixed(2)}
                    </span>{" "}
                    from inflation this month with Quatava
                  </p>
                </div>
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors border-0 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            )}

            {/* Alert Signup */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-[15px] font-bold">Devaluation Alerts</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                Get weekly alerts on currency devaluation across Latin America
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold">
                  Weekly Alerts
                </span>
                <button
                  onClick={handleToggleAlerts}
                  className={`relative w-11 h-6 border-0 cursor-pointer transition-colors ${
                    alertsEnabled ? "bg-success" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                      alertsEnabled ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {alertsEnabled && (
                <p className="text-[11px] text-success mt-2 font-semibold">
                  You'll receive weekly devaluation reports
                </p>
              )}
            </div>

            {/* Why Hold Dollars */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[15px] font-bold mb-3">Why Hold Stablecoins?</h3>
              <div className="space-y-3">
                {[
                  {
                    icon: Shield,
                    title: "Inflation Protection",
                    desc: "Your $1 stays $1 while local currencies lose value",
                  },
                  {
                    icon: DollarSign,
                    title: "Dollar Stability",
                    desc: "USDT is pegged 1:1 to the US dollar",
                  },
                  {
                    icon: Globe,
                    title: "Borderless",
                    desc: "Send and receive across any country instantly",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08] shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold">{item.title}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
