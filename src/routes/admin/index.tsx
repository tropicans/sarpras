import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/client.server";
import { users, assets, assetClosures } from "#/db/schema";
import { count } from "drizzle-orm";
import { authMiddleware } from "#/lib/auth.middleware";
import { Users, Building2, CalendarX } from "lucide-react";
import { useEffect, useState } from "react";

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const [usersCount] = await db.select({ value: count() }).from(users);
    const [assetsCount] = await db.select({ value: count() }).from(assets);
    const [closuresCount] = await db.select({ value: count() }).from(assetClosures);
    return {
      users: usersCount.value,
      assets: assetsCount.value,
      closures: closuresCount.value,
    };
  });

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
  const [stats, setStats] = useState<{ users: number; assets: number; closures: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStatsFn()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-sm font-medium text-[#71717a] animate-pulse">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#09090b]">Dashboard</h2>
        <p className="text-xs text-[#71717a]">Overview of Sarpras PPKASN administration nodes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#fafafa] border border-[#e4e4e7] rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#71717a]">Total Users</span>
            <span className="text-3xl font-bold text-[#09090b]">{stats?.users ?? 0}</span>
          </div>
          <div className="p-3 bg-[#e4e4e7] rounded-lg text-[#09090b]">
            <Users size={24} />
          </div>
        </div>

        <div className="p-6 bg-[#fafafa] border border-[#e4e4e7] rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#71717a]">Total Assets</span>
            <span className="text-3xl font-bold text-[#09090b]">{stats?.assets ?? 0}</span>
          </div>
          <div className="p-3 bg-[#e4e4e7] rounded-lg text-[#09090b]">
            <Building2 size={24} />
          </div>
        </div>

        <div className="p-6 bg-[#fafafa] border border-[#e4e4e7] rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#71717a]">Asset Closures</span>
            <span className="text-3xl font-bold text-[#09090b]">{stats?.closures ?? 0}</span>
          </div>
          <div className="p-3 bg-[#e4e4e7] rounded-lg text-[#09090b]">
            <CalendarX size={24} />
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="p-6 bg-white border border-[#e4e4e7] rounded-xl shadow-sm">
        <h3 className="font-semibold text-lg text-[#09090b]">Welcome to Sarpras Administrative Boundary</h3>
        <p className="mt-2 text-sm text-[#71717a] leading-relaxed">
          Use the left sidebar navigation to manage administrator accounts, provision system roles, deactivate sessions, configure booking assets (rooms/dormitories), and define timezone-aware weekly availability schedules and date-specific closure calendars.
        </p>
      </div>
    </div>
  );
}
