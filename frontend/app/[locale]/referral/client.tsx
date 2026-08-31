"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Gift,
  Users,
  Trophy,
  Share2,
  Copy,
  Star,
  Crown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { $fetch } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

interface ReferralData {
  id: string;
  referredName?: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED";
  reward: number;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalEarned: number;
  activeReferrals: number;
  pendingRewards: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  earned: number;
}

const TIERS = [
  {
    name: "Bronze",
    min: 0,
    max: 4,
    reward: 5,
    perks: ["$5 per referral", "Basic rewards"],
    icon: Star,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/[0.08]",
    border: "border-amber-500/30",
  },
  {
    name: "Silver",
    min: 5,
    max: 19,
    reward: 7,
    perks: ["$7 per referral", "Reduced trading fees"],
    icon: Trophy,
    color: "text-gray-500 dark:text-gray-300",
    bg: "bg-gray-400/[0.08]",
    border: "border-gray-400/30",
  },
  {
    name: "Gold",
    min: 20,
    max: Infinity,
    reward: 10,
    perks: ["$10 per referral", "Free Quatava Card", "VIP support"],
    icon: Crown,
    color: "text-yellow-500 dark:text-yellow-400",
    bg: "bg-yellow-500/[0.08]",
    border: "border-yellow-500/30",
  },
];

const STEPS = [
  {
    step: 1,
    title: "Share Your Link",
    desc: "Copy your unique referral link and share it with friends and family.",
  },
  {
    step: 2,
    title: "Friends Sign Up",
    desc: "When they register using your link, they become your referral.",
  },
  {
    step: 3,
    title: "Earn Rewards",
    desc: "Both of you receive crypto rewards when they complete their first trade.",
  },
];

const PLACEHOLDER_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Carlos M***", referrals: 142, earned: 1420 },
  { rank: 2, name: "Maria G***", referrals: 98, earned: 980 },
  { rank: 3, name: "Juan P***", referrals: 87, earned: 870 },
  { rank: 4, name: "Ana S***", referrals: 65, earned: 650 },
  { rank: 5, name: "Pedro L***", referrals: 54, earned: 540 },
  { rank: 6, name: "Sofia R***", referrals: 48, earned: 480 },
  { rank: 7, name: "Diego V***", referrals: 41, earned: 410 },
  { rank: 8, name: "Lucia F***", referrals: 37, earned: 370 },
  { rank: 9, name: "Mateo C***", referrals: 32, earned: 320 },
  { rank: 10, name: "Valentina H***", referrals: 28, earned: 280 },
];

export default function ReferralClient() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    activeReferrals: 0,
    pendingRewards: 0,
  });
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [calcRefs, setCalcRefs] = useState("10");

  const username = user?.firstName?.toLowerCase() || "user";
  const referralLink = `https://quatava.com/ref/${username}`;

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await $fetch({
        url: "/api/ext/affiliate/referral",
        silent: true,
      });
      if (!error && data) {
        setStats({
          totalReferrals: data.totalReferrals || 0,
          totalEarned: data.totalEarned || 0,
          activeReferrals: data.activeReferrals || 0,
          pendingRewards: data.pendingRewards || 0,
        });
        setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const currentTier = useMemo(() => {
    return (
      TIERS.find(
        (t) =>
          stats.totalReferrals >= t.min && stats.totalReferrals <= t.max
      ) || TIERS[0]
    );
  }, [stats.totalReferrals]);

  const nextTier = useMemo(() => {
    const idx = TIERS.indexOf(currentTier);
    return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  }, [currentTier]);

  const tierProgress = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.min - currentTier.min;
    const progress = stats.totalReferrals - currentTier.min;
    return Math.min(Math.round((progress / range) * 100), 100);
  }, [stats.totalReferrals, currentTier, nextTier]);

  const calculatedEarnings = useMemo(() => {
    const num = parseInt(calcRefs) || 0;
    if (num <= 4) return num * 5;
    if (num <= 19) return 4 * 5 + (num - 4) * 7;
    return 4 * 5 + 15 * 7 + (num - 19) * 10;
  }, [calcRefs]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Join Quatava and protect your money from inflation! Use my link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
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

  const maskName = (name?: string) => {
    if (!name) return "User ***";
    return name.charAt(0) + "***";
  };

  const statusBadge = (status: ReferralData["status"]) => {
    const styles: Record<string, string> = {
      COMPLETED: "bg-[#10B981]/[0.08] text-[#10B981]",
      PENDING: "bg-yellow-500/[0.08] text-yellow-600 dark:text-yellow-400",
      EXPIRED: "bg-gray-500/[0.08] text-gray-500",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${styles[status] || ""}`}
      >
        {status}
      </span>
    );
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Quatava Circle
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Invite friends, earn crypto — everyone wins
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Referrals
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                stats.totalReferrals
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/[0.08]">
                <Gift className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Earned
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-[#10B981]">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                `$${stats.totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Active Referrals
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                stats.activeReferrals
              )}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-yellow-500/[0.08]">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Pending Rewards
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                `$${stats.pendingRewards.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Referral Link */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-[18px] font-bold mb-1">
                Your Referral Link
              </h2>
              <p className="text-[12px] text-muted-foreground mb-4">
                Share this link to earn rewards for every friend who joins
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-primary/[0.08] border border-border p-3 font-mono text-[13px] font-bold text-primary truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="h-[46px] px-4 flex items-center gap-1.5 bg-primary text-white text-[13px] font-bold shrink-0 hover:bg-primary/90 transition-colors"
                >
                  {copied ? (
                    <>
                      <Gift className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="h-[46px] px-4 flex items-center gap-1.5 bg-[#10B981] text-white text-[13px] font-bold shrink-0 hover:bg-[#10B981]/90 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Tier Display */}
            <div>
              <h2 className="text-[18px] font-bold mb-3">Reward Tiers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIERS.map((tier) => {
                  const TierIcon = tier.icon;
                  const isCurrent = tier === currentTier;
                  return (
                    <div
                      key={tier.name}
                      className={`bg-card border p-4 ${
                        isCurrent
                          ? "border-primary border-2"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-8 h-8 flex items-center justify-center ${tier.bg}`}
                        >
                          <TierIcon className={`w-4 h-4 ${tier.color}`} />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold">
                            {tier.name}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">
                            {tier.max === Infinity
                              ? `${tier.min}+ refs`
                              : `${tier.min}-${tier.max} refs`}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="ml-auto text-[10px] uppercase tracking-[0.06em] font-bold text-primary bg-primary/[0.08] px-2 py-0.5">
                            Current
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {tier.perks.map((perk, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
                          >
                            <ArrowRight className="w-3 h-3 text-[#10B981] shrink-0" />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
            {nextTier && (
              <div className="bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold">
                    Progress to {nextTier.name}
                  </span>
                  <span className="text-[13px] font-bold text-primary">
                    {stats.totalReferrals}/{nextTier.min} referrals
                  </span>
                </div>
                <div className="w-full h-3 bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${tierProgress}%` }}
                  />
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">
                  {nextTier.min - stats.totalReferrals} more referrals to
                  unlock {nextTier.name} tier
                </p>
              </div>
            )}

            {/* Referral History */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-[18px] font-bold mb-4">
                Referral History
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted w-full mb-2" />
                      <div className="h-4 bg-muted w-2/3" />
                    </div>
                  ))}
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-[14px] font-semibold text-muted-foreground">
                    No referrals yet
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Share your link to start earning rewards
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Name
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Date
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Status
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 text-right">
                          Reward
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3 pr-4 text-[13px] font-semibold">
                            {maskName(r.referredName)}
                          </td>
                          <td className="py-3 pr-4 text-[12px] text-muted-foreground">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="py-3 pr-4">
                            {statusBadge(r.status)}
                          </td>
                          <td className="py-3 text-[13px] font-bold text-right text-[#10B981]">
                            ${r.reward.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Shareable Card Preview */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-[18px] font-bold mb-3">
                Shareable Card
              </h2>
              <div className="bg-gradient-to-br from-primary to-primary/70 p-6 text-white">
                <div className="text-[24px] font-extrabold mb-1">
                  Quatava
                </div>
                <p className="text-[16px] font-bold opacity-90 mb-4">
                  I&apos;ve saved ${stats.totalEarned.toLocaleString()} from
                  inflation with Quatava
                </p>
                <p className="text-[13px] opacity-80">
                  Join using my link and we both earn crypto rewards
                </p>
                <div className="mt-4 text-[12px] font-mono opacity-70">
                  {referralLink}
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="w-full mt-3 py-2.5 border border-border text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-muted/50 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>

            {/* Leaderboard */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-[18px] font-bold">Leaderboard</h2>
              </div>
              <div className="space-y-2">
                {PLACEHOLDER_LEADERBOARD.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-3 p-2 border border-border"
                  >
                    <div
                      className={`w-7 h-7 flex items-center justify-center text-[12px] font-extrabold shrink-0 ${
                        entry.rank <= 3
                          ? "bg-yellow-500/[0.08] text-yellow-600 dark:text-yellow-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold block truncate">
                        {entry.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {entry.referrals} referrals
                      </span>
                    </div>
                    <span className="text-[13px] font-bold text-[#10B981]">
                      ${entry.earned}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How it Works */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-4">How it Works</h3>
              <div className="space-y-4">
                {STEPS.map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary text-white text-[13px] font-extrabold shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold">{s.title}</h4>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earning Calculator */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">
                Earnings Calculator
              </h3>
              <p className="text-[12px] text-muted-foreground mb-4">
                Estimate how much you can earn with referrals
              </p>
              <div>
                <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                  Number of Referrals
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={calcRefs}
                  onChange={(e) => setCalcRefs(e.target.value)}
                  className="w-full p-3 text-[13px] bg-card border border-border text-foreground outline-none"
                />
              </div>
              <div className="mt-4 p-4 bg-[#10B981]/[0.08] border border-[#10B981]/20">
                <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1">
                  Estimated Earnings
                </span>
                <span className="text-[24px] font-extrabold text-[#10B981]">
                  ${calculatedEarnings.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Share Options */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">Share Options</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 border border-border text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-muted/50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-2.5 bg-[#10B981] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#10B981]/90 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
