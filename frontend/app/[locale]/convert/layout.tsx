"use client";

import type { ReactNode } from "react";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

export default function ConvertLayout({ children }: { children: ReactNode }) {
  return <UserDashboardShell>{children}</UserDashboardShell>;
}
