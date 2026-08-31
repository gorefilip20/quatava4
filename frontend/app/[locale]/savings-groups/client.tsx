"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  CircleDollarSign,
  Calendar,
  Check,
  X as XIcon,
  Shield,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";
import {
  useSavingsGroupStore,
  type SavingsGroup,
} from "@/store/savings-groups/savings-group-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

type Tab = "my" | "discover";

const FREQUENCIES: { value: SavingsGroup["frequency"]; label: string }[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const CURRENCIES = [
  { value: "USDT", label: "USDT" },
  { value: "USDC", label: "USDC" },
];

function getStatusBadge(status: SavingsGroup["status"]) {
  switch (status) {
    case "FORMING":
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase bg-yellow-500/[0.08] text-yellow-600 dark:text-yellow-400">
          Forming
        </span>
      );
    case "ACTIVE":
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase bg-success/[0.08] text-success">
          Active
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase bg-primary/[0.08] text-primary">
          Completed
        </span>
      );
  }
}

export default function SavingsGroupsClient() {
  const { user } = useUserStore();
  const {
    groups,
    myGroups,
    isLoading,
    isCreating,
    fetchGroups,
    fetchMyGroups,
    createGroup,
    joinGroup,
    contributeToGroup,
  } = useSavingsGroupStore();

  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formCurrency, setFormCurrency] = useState("USDT");
  const [formAmount, setFormAmount] = useState("");
  const [formFrequency, setFormFrequency] = useState<SavingsGroup["frequency"]>("MONTHLY");
  const [formMaxMembers, setFormMaxMembers] = useState(5);

  // Join loading
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [contributingId, setContributingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyGroups();
      fetchGroups();
    }
  }, [user]);

  const handleCreate = async () => {
    if (!formName || !formAmount || parseFloat(formAmount) <= 0) return;
    const result = await createGroup({
      name: formName,
      currency: formCurrency,
      contributionAmount: parseFloat(formAmount),
      frequency: formFrequency,
      maxMembers: formMaxMembers,
    });
    if (result.success) {
      setFormName("");
      setFormAmount("");
      setFormMaxMembers(5);
      setShowCreate(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    await joinGroup(groupId);
    setJoiningId(null);
  };

  const handleContribute = async (groupId: string) => {
    setContributingId(groupId);
    await contributeToGroup(groupId);
    setContributingId(null);
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

  const totalCircles = myGroups.length;
  const activeCircles = myGroups.filter((g) => g.status === "ACTIVE").length;
  const totalPooled = myGroups.reduce((sum, g) => sum + g.totalPool, 0);

  // Discover: filter out groups user already belongs to
  const discoverGroups = groups.filter(
    (g) =>
      g.status === "FORMING" &&
      g.memberCount < g.maxMembers &&
      !myGroups.some((mg) => mg.id === g.id)
  );

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
              Savings Circles
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Traditional tandas, modernized with stablecoins — save together, grow together
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="sm:self-start py-2 px-4 bg-primary text-white text-[13px] font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Circle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                My Circles
              </span>
            </div>
            <div className="text-[20px] font-extrabold">{totalCircles}</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <Check className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Active
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success">{activeCircles}</div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <CircleDollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Pooled
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              ${totalPooled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Available
              </span>
            </div>
            <div className="text-[20px] font-extrabold">{discoverGroups.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          {([
            { key: "my" as Tab, label: "My Circles" },
            { key: "discover" as Tab, label: "Discover" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[13px] font-bold border-0 bg-transparent cursor-pointer transition-colors relative ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {activeTab === "my" && (
              <>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card border border-border p-5 animate-pulse">
                        <div className="h-5 bg-muted w-1/3 mb-3" />
                        <div className="h-4 bg-muted w-2/3 mb-2" />
                        <div className="h-4 bg-muted w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : myGroups.length > 0 ? (
                  <div className="space-y-4">
                    {myGroups.map((group) => {
                      const userId = user?.id;
                      const currentMember = group.members.find(
                        (m) => m.userId === userId
                      );
                      const needsContribution =
                        group.status === "ACTIVE" &&
                        currentMember &&
                        !currentMember.hasPaid;

                      return (
                        <div key={group.id} className="bg-card border border-border p-5">
                          {/* Group Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-[15px] font-bold">{group.name}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                                  <Users className="w-3.5 h-3.5" />
                                  {group.memberCount}/{group.maxMembers}
                                </span>
                                <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Round {group.currentRound} of {group.totalRounds}
                                </span>
                              </div>
                            </div>
                            {getStatusBadge(group.status)}
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-3 gap-3 py-3 border-t border-border">
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                                Contribution
                              </span>
                              <span className="text-[14px] font-extrabold">
                                ${group.contributionAmount} {group.currency}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                                Pool
                              </span>
                              <span className="text-[14px] font-extrabold">
                                ${group.totalPool.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                                Next Payout
                              </span>
                              <span className="text-[13px] font-bold">
                                {formatDate(group.nextPayoutDate)}
                              </span>
                            </div>
                          </div>

                          {/* Progress Steps */}
                          <div className="pt-3 border-t border-border">
                            <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                              Round Progress
                            </span>
                            <div className="flex gap-1">
                              {Array.from({ length: group.totalRounds }, (_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 flex-1 ${
                                    i < group.currentRound
                                      ? "bg-success"
                                      : i === group.currentRound
                                      ? "bg-primary"
                                      : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Members */}
                          <div className="pt-3 border-t border-border mt-3">
                            <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-2">
                              Members
                            </span>
                            <div className="space-y-1.5">
                              {group.members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-[12px] font-semibold">
                                    {member.name}
                                    {member.userId === userId && (
                                      <span className="text-primary ml-1">(you)</span>
                                    )}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {member.hasPaid ? (
                                      <span className="flex items-center gap-1 text-[11px] text-success font-bold">
                                        <Check className="w-3.5 h-3.5" />
                                        Paid
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[11px] text-red-500 font-bold">
                                        <XIcon className="w-3.5 h-3.5" />
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Contribute Button */}
                          {needsContribution && (
                            <button
                              onClick={() => handleContribute(group.id)}
                              disabled={contributingId === group.id}
                              className="w-full mt-4 py-2.5 bg-success text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-success/90 transition-colors border-0 cursor-pointer disabled:opacity-50"
                            >
                              {contributingId === group.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Contributing...
                                </>
                              ) : (
                                <>
                                  <CircleDollarSign className="w-4 h-4" />
                                  Contribute ${group.contributionAmount}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-card border border-border p-8 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-[13px] text-muted-foreground font-semibold">
                      You haven't joined any circles yet
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Discover available circles or create your own
                    </p>
                    <button
                      onClick={() => setActiveTab("discover")}
                      className="mt-4 py-2 px-4 bg-primary text-white text-[13px] font-bold flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors border-0 cursor-pointer"
                    >
                      Discover Circles
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === "discover" && (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-card border border-border p-5 animate-pulse">
                        <div className="h-5 bg-muted w-1/3 mb-3" />
                        <div className="h-4 bg-muted w-2/3 mb-2" />
                        <div className="h-4 bg-muted w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : discoverGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discoverGroups.map((group) => (
                      <div key={group.id} className="bg-card border border-border p-5">
                        <h3 className="text-[15px] font-bold mb-1">{group.name}</h3>
                        <p className="text-[12px] text-muted-foreground mb-3">
                          Created by {group.creatorName}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-muted-foreground">
                              Contribution
                            </span>
                            <span className="text-[12px] font-bold">
                              ${group.contributionAmount} {group.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-muted-foreground">
                              Frequency
                            </span>
                            <span className="text-[12px] font-bold">
                              {group.frequency.charAt(0) + group.frequency.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-muted-foreground">
                              Spots Available
                            </span>
                            <span className="text-[12px] font-bold text-success">
                              {group.maxMembers - group.memberCount} of {group.maxMembers}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoin(group.id)}
                          disabled={joiningId === group.id}
                          className="w-full py-2.5 bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors border-0 cursor-pointer disabled:opacity-50"
                        >
                          {joiningId === group.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Join Circle
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border p-8 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-[13px] text-muted-foreground font-semibold">
                      No circles available
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Create one and invite your friends!
                    </p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-4 py-2 px-4 bg-primary text-white text-[13px] font-bold flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors border-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Create Circle
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Create Form */}
            {showCreate && (
              <div className="bg-card border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-primary" />
                  <h3 className="text-[15px] font-bold">Create Circle</h3>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Circle Name
                    </span>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="My Savings Circle"
                      className="w-full py-2.5 px-3 text-[13px] bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Currency
                    </span>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value)}
                      className="w-full py-2.5 px-3 text-[13px] bg-card border border-border text-foreground outline-none cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contribution Amount */}
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Contribution Amount
                    </span>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="50"
                      min="1"
                      className="w-full py-2.5 px-3 text-[13px] bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Frequency
                    </span>
                    <div className="flex gap-2">
                      {FREQUENCIES.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setFormFrequency(f.value)}
                          className={`flex-1 py-2 text-[12px] font-bold border cursor-pointer transition-colors ${
                            formFrequency === f.value
                              ? "bg-primary text-white border-primary"
                              : "bg-card text-foreground border-border hover:bg-muted/30"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Members */}
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Max Members (3-15)
                    </span>
                    <input
                      type="number"
                      value={formMaxMembers}
                      onChange={(e) =>
                        setFormMaxMembers(
                          Math.min(15, Math.max(3, parseInt(e.target.value) || 3))
                        )
                      }
                      min={3}
                      max={15}
                      className="w-full py-2.5 px-3 text-[13px] bg-card border border-border text-foreground outline-none"
                    />
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !formName || !formAmount}
                    className="w-full py-2.5 bg-primary text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Circle
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Cultural Explainer */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[15px] font-bold mb-3">
                What are Savings Circles?
              </h3>
              <p className="text-[12px] text-muted-foreground mb-4">
                A traditional community savings practice where members regularly
                contribute a fixed amount, and each round one member receives the
                full pool.
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Tandas",
                    region: "Mexico",
                    desc: "Rotating savings clubs where trust is built through community bonds",
                  },
                  {
                    name: "Vaquinhas",
                    region: "Brazil",
                    desc: "\"Little cows\" — collective savings pools popular among friends and family",
                  },
                  {
                    name: "Pasanaku",
                    region: "Bolivia",
                    desc: "Indigenous community savings tradition based on reciprocity",
                  },
                ].map((item) => (
                  <div key={item.name} className="border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold">{item.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        ({item.region})
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[15px] font-bold mb-3">Trust & Security</h3>
              <div className="space-y-3">
                {[
                  {
                    icon: Shield,
                    title: "Escrow-Protected",
                    desc: "Funds held in smart contract escrow until payout",
                  },
                  {
                    icon: ArrowRight,
                    title: "Automated Payouts",
                    desc: "No manual transfers — payouts happen automatically",
                  },
                  {
                    icon: CircleDollarSign,
                    title: "USDT-Denominated",
                    desc: "Contributions in stablecoins to avoid currency risk",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08] shrink-0">
                        <Icon className="w-4 h-4 text-success" />
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
