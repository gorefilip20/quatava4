"use client";

import { BalanceCard } from "./components/balance-card";
import { QuickActions } from "./components/quick-actions";
import { PortfolioChart } from "./components/portfolio-chart";
import { AssetsTable } from "./components/assets-table";
import { RecentActivity } from "./components/recent-activity";

export function DashboardClient() {
  return (
    <div className="space-y-4">
      {/* Hero balance + mini asset cards */}
      <BalanceCard />

      {/* Quick actions row */}
      <QuickActions />

      {/* Portfolio chart — full width */}
      <PortfolioChart />

      {/* Assets table + Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <AssetsTable />
        <RecentActivity />
      </div>
    </div>
  );
}
