"use client";

import type { ReactNode } from "react";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

export default function UserLayout({ children }: { children: ReactNode }) {
  return <UserDashboardShell>{children}</UserDashboardShell>;
}
