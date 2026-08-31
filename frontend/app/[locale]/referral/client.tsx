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
  Check,
  Loader2,
  MessageCircle,
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
  { name: "Bronze", min: 0, max: 4, reward: 5, perks: ["$5 per referral", "Basic rewards"], color: "#CD7F32" },
  { name: "Silver", min: 5, max: 19, reward: 7, perks: ["$7 per referral", "Reduced fees"], color: "#94A3B8" },
  { name: "Gold", min: 20, max: Infinity, reward: 10, perks: ["$10 per referral", "Free Card", "VIP support"], color: "#EAB308" },
];

const LEADERBOARD: LeaderboardEntry[] = [
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
  const [calcRefs, setCalcRefs] = useState(10);

  const username = user?.firstName?.toLowerCase() || "user";
  const referralLink = `https://quatava.com/ref/${username}`;

  useEffect(() => {
    if (user) fetchReferralData();
  }, [user]);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await $fetch({ url: "/api/ext/affiliate/referral", silent: true });
      if (!error && data) {
        setStats({
          totalReferrals: data.totalReferrals || 0,
          totalEarned: data.totalEarned || 0,
          activeReferrals: data.activeReferrals || 0,
          pendingRewards: data.pendingRewards || 0,
        });
        setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  };

  const currentTier = useMemo(() => TIERS.find((t) => stats.totalReferrals >= t.min && stats.totalReferrals <= t.max) || TIERS[0], [stats.totalReferrals]);
  const currentTierIdx = TIERS.indexOf(currentTier);
  const nextTier = currentTierIdx < TIERS.length - 1 ? TIERS[currentTierIdx + 1] : null;

  const trackProgress = useMemo(() => {
    if (currentTierIdx >= TIERS.length - 1) return 100;
    const segmentWidth = 100 / (TIERS.length - 1);
    const withinTier = nextTier ? (stats.totalReferrals - currentTier.min) / (nextTier.min - currentTier.min) : 1;
    return Math.min(currentTierIdx * segmentWidth + withinTier * segmentWidth, 100);
  }, [stats.totalReferrals, currentTierIdx, currentTier, nextTier]);

  const calculatedEarnings = useMemo(() => {
    const n = calcRefs || 0;
    if (n <= 4) return n * 5;
    if (n <= 19) return 4 * 5 + (n - 4) * 7;
    return 4 * 5 + 15 * 7 + (n - 19) * 10;
  }, [calcRefs]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Join Quatava and protect your money from inflation! Use my link: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <UserDashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Quatava Circle</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Invite friends, earn crypto — everyone wins</p>
        </div>

        {/* Invite Card + Stats — hero section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* Shareable invite card */}
          <div
            className="relative overflow-hidden p-6 text-white"
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              minHeight: 240,
            }}
          >
            {/* QR-style decorative grid */}
            <div className="absolute top-4 right-4 w-16 h-16 opacity-20" style={{
              backgroundImage: `repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)`,
              backgroundSize: "8px 8px",
            }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 flex items-center justify-center bg-white/20 text-white font-extrabold text-sm">Q</div>
                <span className="text-[13px] font-bold opacity-80">QUATAVA INVITE</span>
              </div>

              <p className="text-[18px] font-bold leading-snug mb-1">Join me on Quatava</p>
              <p className="text-[13px] opacity-70 mb-6">Protect your money from inflation with crypto</p>

              <div className="font-mono text-[20px] font-extrabold tracking-wider mb-6" style={{ letterSpacing: "0.15em" }}>
                {username.toUpperCase().slice(0, 8)}
              </div>

              <div className="text-[11px] font-mono opacity-50 truncate">{referralLink}</div>
            </div>
          </div>

          {/* Stats — large numbers, no cards */}
          <div className="flex flex-col justify-between py-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {[
                { label: "Total Referrals", value: stats.totalReferrals, prefix: "" },
                { label: "Total Earned", value: stats.totalEarned, prefix: "$", color: "text-success" },
                { label: "Active", value: stats.activeReferrals, prefix: "" },
                { label: "Pending", value: stats.pendingRewards, prefix: "$" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold mb-1">{s.label}</div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className={`text-[28px] font-extrabold ${s.color || ""}`}>
                      {s.prefix}{s.value.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Share buttons */}
            <div className="flex gap-2 mt-6">
              <button onClick={handleCopy} className="flex-1 py-3 flex items-center justify-center gap-2 bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-colors">
                {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </button>
              <button onClick={handleWhatsApp} className="flex-1 py-3 flex items-center justify-center gap-2 bg-success text-white text-[13px] font-bold hover:bg-success/90 transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Tier Progress Track — the unique visual element */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-[16px] font-bold mb-6">Your Tier Progress</h2>

          {/* Track */}
          <div className="relative">
            {/* Background track */}
            <div className="h-2 bg-muted w-full" />
            {/* Filled track */}
            <div className="absolute top-0 left-0 h-2 bg-primary transition-all duration-700" style={{ width: `${trackProgress}%` }} />
            {/* Glowing current position dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary transition-all duration-700"
              style={{
                left: `calc(${trackProgress}% - 8px)`,
                boxShadow: "0 0 12px rgba(51,117,187,0.6)",
              }}
            />

            {/* Tier markers */}
            <div className="flex justify-between mt-4">
              {TIERS.map((tier, i) => {
                const isReached = i <= currentTierIdx;
                const Icon = i === 0 ? Star : i === 1 ? Trophy : Crown;
                return (
                  <div key={tier.name} className={`flex flex-col items-center ${i === 0 ? "items-start" : i === TIERS.length - 1 ? "items-end" : "items-center"}`}>
                    <div
                      className={`w-10 h-10 flex items-center justify-center mb-2 ${isReached ? "border-2" : "border border-border bg-card"}`}
                      style={isReached ? { borderColor: tier.color, backgroundColor: `${tier.color}15` } : undefined}
                    >
                      <Icon className="w-5 h-5" style={{ color: isReached ? tier.color : undefined }} />
                    </div>
                    <span className={`text-[13px] font-bold ${isReached ? "" : "text-muted-foreground"}`}>{tier.name}</span>
                    <span className="text-[20px] font-extrabold" style={isReached ? { color: tier.color } : undefined}>${tier.reward}</span>
                    <span className="text-[11px] text-muted-foreground">per referral</span>
                  </div>
                );
              })}
            </div>
          </div>

          {nextTier && (
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                <span className="font-bold text-foreground">{nextTier.min - stats.totalReferrals}</span> more referrals to unlock <span className="font-bold">{nextTier.name}</span>
              </span>
              <span className="text-[13px] font-bold text-primary">{stats.totalReferrals}/{nextTier.min}</span>
            </div>
          )}
        </div>

        {/* Referral history + Leaderboard side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* History */}
          <div className="bg-card border border-border p-6">
            <h2 className="text-[16px] font-bold mb-4">Referral History</h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 py-3">
                    <div className="w-9 h-9 bg-muted" />
                    <div className="flex-1"><div className="h-4 bg-muted w-1/3 mb-1" /><div className="h-3 bg-muted w-1/4" /></div>
                  </div>
                ))}
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-muted-foreground">No referrals yet</p>
                <p className="text-[12px] text-muted-foreground mt-1">Share your link above to start earning</p>
              </div>
            ) : (
              <div className="space-y-1">
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                    <div className="w-9 h-9 flex items-center justify-center bg-primary/[0.08] text-primary text-[14px] font-extrabold shrink-0">
                      {(r.referredName || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold block truncate">{r.referredName ? `${r.referredName[0]}${"*".repeat(3)}` : "User ***"}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                      r.status === "COMPLETED" ? "bg-success/[0.08] text-success"
                        : r.status === "PENDING" ? "bg-warning/[0.08] text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}>{r.status}</span>
                    <span className="text-[13px] font-bold text-success w-16 text-right">${r.reward.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#EAB308]" />
                <h2 className="text-[16px] font-bold">Top Referrers</h2>
              </div>

              <div className="space-y-1">
                {LEADERBOARD.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const rankColors = ["#EAB308", "#94A3B8", "#CD7F32"];
                  return (
                    <div key={entry.rank} className={`flex items-center gap-3 py-2.5 ${isTop3 ? "border-b border-border" : ""}`}>
                      <div
                        className="w-7 h-7 flex items-center justify-center text-[12px] font-extrabold shrink-0"
                        style={isTop3 ? { backgroundColor: `${rankColors[entry.rank - 1]}20`, color: rankColors[entry.rank - 1] } : undefined}
                      >
                        {isTop3 ? (
                          <span style={{ fontSize: entry.rank === 1 ? 14 : 12 }}>{entry.rank}</span>
                        ) : (
                          <span className="text-muted-foreground">{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[13px] block truncate ${isTop3 ? "font-bold" : "font-semibold"}`}>{entry.name}</span>
                        <span className="text-[11px] text-muted-foreground">{entry.referrals} referrals</span>
                      </div>
                      <span className={`text-[13px] font-bold text-success ${isTop3 ? "text-[14px]" : ""}`}>${entry.earned}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Earnings calculator — compact */}
            <div className="bg-card border border-border p-6">
              <h3 className="text-[14px] font-bold mb-3">Earnings Calculator</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-muted-foreground shrink-0">If you refer</span>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={calcRefs}
                  onChange={(e) => setCalcRefs(parseInt(e.target.value) || 0)}
                  className="w-20 py-2 px-3 text-[14px] font-bold text-center bg-card border border-border text-foreground outline-none"
                />
                <span className="text-[13px] text-muted-foreground shrink-0">friends</span>
              </div>
              <div className="mt-3 py-3 bg-success/[0.08] border border-success/20 text-center">
                <span className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">You earn</span>
                <span className="text-[28px] font-extrabold text-success">${calculatedEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
