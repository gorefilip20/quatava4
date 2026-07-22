"use client";

import {
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  RefreshCw,
  DollarSign,
  Activity,
} from "lucide-react";
import { BalanceCard } from "./components/balance-card";
import { QuickActions } from "./components/quick-actions";
import { PortfolioChart } from "./components/portfolio-chart";
import { Watchlist } from "./components/watchlist";
import { AssetsTable } from "./components/assets-table";
import { RecentActivity } from "./components/recent-activity";

export function DashboardClient() {
  return (
    <div className="space-y-4">
      {/* Balance card */}
      <BalanceCard />

      {/* Quick actions */}
      <QuickActions />

      {/* Chart + Watchlist */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <PortfolioChart />
        <Watchlist />
      </div>

      {/* Assets + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <AssetsTable />
        <RecentActivity />
      </div>
    </div>
  );
}
