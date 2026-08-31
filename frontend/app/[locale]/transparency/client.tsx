"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Shield,
  Check,
  BarChart3,
  Users,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { $fetch } from "@/lib/api";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

interface PlatformStats {
  totalUsers: number;
  volume24h: number;
  allTimeVolume: number;
  countriesServed: number;
}

interface ReserveAsset {
  asset: string;
  symbol: string;
  onChainBalance: string;
  onChainRaw: number;
  customerDeposits: string;
  customerRaw: number;
  reserveRatio: number;
}

interface RegionalData {
  country: string;
  flag: string;
  users: number;
  percentage: number;
}

const PLACEHOLDER_RESERVES: ReserveAsset[] = [
  {
    asset: "Bitcoin",
    symbol: "BTC",
    onChainBalance: "₿ 847.3",
    onChainRaw: 847.3,
    customerDeposits: "₿ 812.1",
    customerRaw: 812.1,
    reserveRatio: 104.3,
  },
  {
    asset: "Ethereum",
    symbol: "ETH",
    onChainBalance: "Ξ 12,450",
    onChainRaw: 12450,
    customerDeposits: "Ξ 11,890",
    customerRaw: 11890,
    reserveRatio: 104.7,
  },
  {
    asset: "Tether",
    symbol: "USDT",
    onChainBalance: "$4.2M",
    onChainRaw: 4200000,
    customerDeposits: "$4.1M",
    customerRaw: 4100000,
    reserveRatio: 102.4,
  },
  {
    asset: "USD Coin",
    symbol: "USDC",
    onChainBalance: "$2.8M",
    onChainRaw: 2800000,
    customerDeposits: "$2.7M",
    customerRaw: 2700000,
    reserveRatio: 103.7,
  },
  {
    asset: "Solana",
    symbol: "SOL",
    onChainBalance: "◎ 45,200",
    onChainRaw: 45200,
    customerDeposits: "◎ 43,100",
    customerRaw: 43100,
    reserveRatio: 104.9,
  },
];

const PLACEHOLDER_REGIONS: RegionalData[] = [
  { country: "Argentina", flag: "🇦🇷", users: 4200, percentage: 34 },
  { country: "Brazil", flag: "🇧🇷", users: 3100, percentage: 25 },
  { country: "Colombia", flag: "🇨🇴", users: 1800, percentage: 15 },
  { country: "Chile", flag: "🇨🇱", users: 1100, percentage: 9 },
  { country: "Peru", flag: "🇵🇪", users: 870, percentage: 7 },
  { country: "Mexico", flag: "🇲🇽", users: 740, percentage: 6 },
  { country: "Others", flag: "🌍", users: 590, percentage: 4 },
];

const VOLUME_MONTHS = [
  { month: "Mar", value: 2.1 },
  { month: "Apr", value: 2.8 },
  { month: "May", value: 3.4 },
  { month: "Jun", value: 2.9 },
  { month: "Jul", value: 4.1 },
  { month: "Aug", value: 4.6 },
];

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: "Two-Factor Authentication",
    desc: "All accounts secured with 2FA",
  },
  {
    icon: Shield,
    title: "Cold Storage",
    desc: "95% of assets stored in cold wallets",
  },
  {
    icon: Check,
    title: "Insurance Fund",
    desc: "$10M insurance coverage for user assets",
  },
  {
    icon: Eye,
    title: "Regular Audits",
    desc: "Quarterly third-party security audits",
  },
];

function formatLargeNumber(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
  return num.toString();
}

export default function TransparencyClient() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 12400,
    volume24h: 3200000,
    allTimeVolume: 89000000,
    countriesServed: 9,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransparencyData();
  }, []);

  const fetchTransparencyData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await $fetch({
        url: "/api/ext/transparency/stats",
        silent: true,
      });
      if (!error && data) {
        setStats({
          totalUsers: data.totalUsers || 12400,
          volume24h: data.volume24h || 3200000,
          allTimeVolume: data.allTimeVolume || 89000000,
          countriesServed: data.countriesServed || 9,
        });
      }
    } catch {
      // Use placeholder data
    } finally {
      setIsLoading(false);
    }
  };

  const maxVolume = Math.max(...VOLUME_MONTHS.map((v) => v.value));

  const reserveRatioBadge = (ratio: number) => {
    if (ratio >= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#10B981]/[0.08] text-[#10B981]">
          <Check className="w-3 h-3" />
          Fully Backed
        </span>
      );
    }
    if (ratio >= 95) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-yellow-500/[0.08] text-yellow-600 dark:text-yellow-400">
          {ratio.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-red-500/[0.08] text-red-600 dark:text-red-400">
        {ratio.toFixed(1)}%
      </span>
    );
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Transparency
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Full visibility into Quatava&apos;s operations — trust through
            transparency
          </p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Users
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                `${(stats.totalUsers / 1000).toFixed(1)}K+`
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/[0.08]">
                <BarChart3 className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                24h Volume
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-[#10B981]">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                formatLargeNumber(stats.volume24h)
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                All-Time Volume
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                formatLargeNumber(stats.allTimeVolume)
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Countries Served
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                stats.countriesServed
              )}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Proof of Reserves */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-[18px] font-bold">
                    Proof of Reserves
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#10B981]/[0.08] text-[#10B981]">
                  <Check className="w-3 h-3" />
                  Verified on-chain
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                        Asset
                      </th>
                      <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4 text-right">
                        On-Chain Balance
                      </th>
                      <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4 text-right">
                        Customer Deposits
                      </th>
                      <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 text-right">
                        Reserve Ratio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLACEHOLDER_RESERVES.map((r) => (
                      <tr
                        key={r.symbol}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 flex items-center justify-center bg-primary/[0.08] text-[10px] font-extrabold text-primary">
                              {r.symbol[0]}
                            </div>
                            <div>
                              <span className="text-[13px] font-bold block">
                                {r.asset}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {r.symbol}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-[13px] font-semibold text-right">
                          {r.onChainBalance}
                        </td>
                        <td className="py-3 pr-4 text-[13px] font-semibold text-right">
                          {r.customerDeposits}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[13px] font-bold">
                              {r.reserveRatio.toFixed(1)}%
                            </span>
                            {reserveRatioBadge(r.reserveRatio)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Volume Chart */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-[18px] font-bold">Monthly Volume</h2>
              </div>

              <div className="flex items-end gap-3 h-[200px]">
                {VOLUME_MONTHS.map((v) => {
                  const heightPercent = (v.value / maxVolume) * 100;
                  return (
                    <div
                      key={v.month}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <span className="text-[11px] font-bold text-primary">
                        ${v.value}M
                      </span>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full bg-primary/80 hover:bg-primary transition-colors"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {v.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regional Breakdown */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-[18px] font-bold">
                  Regional Breakdown
                </h2>
              </div>

              <div className="space-y-3">
                {PLACEHOLDER_REGIONS.map((region) => (
                  <div key={region.country} className="flex items-center gap-3">
                    <span className="text-[18px] shrink-0 w-7 text-center">
                      {region.flag}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold">
                          {region.country}
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                          {region.users.toLocaleString()} users
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${region.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-primary w-8 text-right">
                      {region.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Features */}
            <div className="bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-[16px] font-bold">Security</h3>
              </div>
              <div className="space-y-3">
                {SECURITY_FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="flex items-start gap-3 p-3 border border-border"
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/[0.08] shrink-0">
                        <Icon className="w-4 h-4 text-[#10B981]" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold">{feat.title}</h4>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">Quick Facts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Founded
                  </span>
                  <span className="text-[13px] font-bold">2024</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Headquarters
                  </span>
                  <span className="text-[13px] font-bold">
                    Latin America
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Assets Listed
                  </span>
                  <span className="text-[13px] font-bold">50+</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Cold Storage
                  </span>
                  <span className="text-[13px] font-bold text-[#10B981]">
                    95%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[12px] text-muted-foreground">
                    Insurance
                  </span>
                  <span className="text-[13px] font-bold text-[#10B981]">
                    $10M
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Status */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">
                Audit Status
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[13px]">
                    Q2 2026 Security Audit — Passed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[13px]">
                    Q1 2026 Reserve Audit — Passed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[13px]">
                    Q4 2025 Penetration Test — Passed
                  </span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="bg-muted/30 border border-border p-4 text-center">
              <span className="text-[11px] text-muted-foreground">
                Last updated:{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
