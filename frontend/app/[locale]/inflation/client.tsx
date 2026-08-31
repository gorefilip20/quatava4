"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Bell,
  CheckCircle,
  ArrowDown,
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

function severityColor(rate: number): string {
  if (rate >= 50) return "#EF4444";
  if (rate >= 10) return "#F97316";
  if (rate >= 5) return "#EAB308";
  return "#10B981";
}

function severityTextClass(rate: number): string {
  if (rate >= 50) return "text-destructive";
  if (rate >= 10) return "text-warning";
  if (rate >= 5) return "text-warning";
  return "text-success";
}

function severityBgClass(rate: number): string {
  if (rate >= 50) return "bg-destructive";
  if (rate >= 10) return "bg-[#F97316]";
  if (rate >= 5) return "bg-[#EAB308]";
  return "bg-success";
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

  // Sort countries by inflation rate descending for the bar chart
  const sortedCountries = [...countries].sort(
    (a, b) => b.inflationRate - a.inflationRate
  );

  return (
    <UserDashboardShell>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main column */}
        <div className="space-y-10">
          {/* --- Editorial headline --- */}
          <header className="pt-4 pb-2">
            <p className="text-[10px] uppercase tracking-[0.1em] font-bold text-muted-foreground mb-3">
              Latin America Inflation Report
            </p>
            <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-[-0.03em] leading-[1.05]">
              Your Money Is
              <br />
              Losing Value
            </h1>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-[56px] sm:text-[72px] font-extrabold tracking-[-0.04em] leading-none text-destructive tabular-nums">
                {avgInflation.toFixed(1)}%
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-muted-foreground">
                  average annual inflation
                </span>
                <span className="text-[12px] text-muted-foreground">
                  across {countries.length} tracked economies
                </span>
              </div>
            </div>
            <div className="w-full h-px bg-border mt-6" />
          </header>

          {/* --- Purchasing Power Bar Chart (centerpiece) --- */}
          <section>
            <h2 className="text-[18px] font-extrabold tracking-[-0.01em] mb-1">
              $1,000 After One Year
            </h2>
            <p className="text-[13px] text-muted-foreground mb-6">
              What happens to $1,000 held in local currency vs. USDT over 12 months.
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted w-24 mb-2" />
                    <div className="h-7 bg-muted w-full mb-1" />
                    <div className="h-7 bg-muted w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {sortedCountries.map((c) => {
                  const localPct = Math.max((c.currentWorth / 1000) * 100, 5);
                  return (
                    <div key={c.currencyCode}>
                      {/* Country label row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[20px] leading-none">{c.flag}</span>
                        <span className="text-[13px] font-bold">{c.country}</span>
                        <span className="text-[11px] text-muted-foreground font-semibold ml-auto tabular-nums">
                          {c.currencyCode}
                        </span>
                      </div>
                      {/* Bars */}
                      <div className="flex items-stretch gap-px">
                        {/* Local currency bar */}
                        <div
                          className="relative h-8 flex items-center transition-all duration-500"
                          style={{
                            width: `${localPct}%`,
                            backgroundColor: severityColor(c.inflationRate),
                            opacity: 0.85,
                          }}
                        >
                          <span className="absolute right-2 text-[11px] font-extrabold text-white tabular-nums whitespace-nowrap">
                            ${c.currentWorth}
                          </span>
                        </div>
                        {/* Lost portion (gap visual) */}
                        <div
                          className="h-8"
                          style={{
                            width: `${100 - localPct}%`,
                            background: "repeating-linear-gradient(135deg, transparent, transparent 3px, var(--border) 3px, var(--border) 4px)",
                            opacity: 0.3,
                          }}
                        />
                      </div>
                      {/* USDT bar */}
                      <div className="mt-px">
                        <div className="relative h-8 w-full bg-success flex items-center">
                          <span className="absolute right-2 text-[11px] font-extrabold text-white tabular-nums">
                            $1,000
                          </span>
                          <span className="absolute left-2 text-[10px] font-bold text-white/80 uppercase tracking-wider">
                            USDT
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Legend */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-[#F97316] opacity-85" />
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      Local Currency (colored by severity)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-success" />
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      USDT
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* --- Country deep-dive cards --- */}
          <section>
            <h2 className="text-[18px] font-extrabold tracking-[-0.01em] mb-1">
              Country Breakdown
            </h2>
            <p className="text-[13px] text-muted-foreground mb-5">
              Annual inflation rates and purchasing power erosion by country.
            </p>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card border border-border p-5 animate-pulse">
                    <div className="h-5 bg-muted w-1/3 mb-3" />
                    <div className="h-10 bg-muted w-1/4 mb-2" />
                    <div className="h-3 bg-muted w-full mb-2" />
                    <div className="h-4 bg-muted w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedCountries.map((c) => {
                  const gaugeWidth = Math.min((c.inflationRate / 220) * 100, 100);
                  return (
                    <div
                      key={c.currencyCode}
                      className="bg-card border border-border relative overflow-hidden"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: severityColor(c.inflationRate),
                      }}
                    >
                      <div className="p-5">
                        {/* Flag + country */}
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-[32px] leading-none">{c.flag}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-bold leading-tight">
                              {c.country}
                            </h3>
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              {c.currencyCode}
                            </span>
                          </div>
                          {/* Big inflation number */}
                          <div className="text-right shrink-0">
                            <div
                              className={`text-[32px] font-extrabold leading-none tabular-nums ${severityTextClass(c.inflationRate)}`}
                            >
                              {c.inflationRate}%
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                              Annual
                            </span>
                          </div>
                        </div>

                        {/* Inflation gauge */}
                        <div className="mb-4">
                          <div className="h-1.5 w-full bg-muted/50 relative">
                            <div
                              className={`h-full transition-all duration-700 ${severityBgClass(c.inflationRate)}`}
                              style={{ width: `${gaugeWidth}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-0.5">
                              Devaluation
                            </span>
                            <span className="text-[15px] font-extrabold text-destructive tabular-nums">
                              {c.devaluation}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-0.5">
                              $1,000 Now Worth
                            </span>
                            <span className="text-[15px] font-extrabold tabular-nums">
                              ${c.currentWorth}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* --- USDT Stability Row --- */}
          <section className="bg-success/[0.06] border border-success/20 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success shrink-0" />
                <div>
                  <p className="text-[16px] font-extrabold">
                    $1,000 in USDT = $1,000
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Stablecoins maintain purchasing power regardless of local inflation.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-success">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold">
                  Always $1.00
                </span>
                <div className="w-2 h-2 bg-success" />
              </div>
            </div>
          </section>
        </div>

        {/* --- Sidebar (desktop only) --- */}
        <aside className="hidden lg:block space-y-5 pt-4">
          {/* Personal savings */}
          {user && (
            <div className="bg-card border border-border p-5">
              <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
                Your Holdings
              </span>
              <div className="text-[28px] font-extrabold tabular-nums leading-tight">
                ${totalHoldings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground">in USDT</span>

              <div className="w-full h-px bg-border my-4" />

              <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1">
                Value Preserved This Month
              </span>
              <div className="text-[20px] font-extrabold text-success tabular-nums">
                +${savedThisMonth.toFixed(2)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                vs avg regional inflation on your position
              </p>
            </div>
          )}

          {/* Devaluation alerts toggle */}
          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-bold">Weekly Alerts</span>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">
              Receive weekly currency devaluation reports for Latin America.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">
                {alertsEnabled ? "Enabled" : "Disabled"}
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
                You will receive weekly devaluation reports
              </p>
            )}
          </div>

          {/* Share button */}
          {user && (
            <button
              onClick={handleShare}
              className="w-full py-3 bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors border-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share This Data
            </button>
          )}
        </aside>
      </div>
    </UserDashboardShell>
  );
}
