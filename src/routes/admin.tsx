import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { getSessionFn } from "#/lib/auth.middleware";
import { authClient } from "#/lib/auth-client";
import {
	Building2,
	Calendar,
	CalendarCheck2,
	LayoutDashboard,
	LogOut,
	ScrollText,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const session = await getSessionFn();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		if (session.user.status === "inactive") {
			throw redirect({ to: "/login" });
		}
		if (session.user.mustResetPassword) {
			throw redirect({ to: "/login" });
		}
		return { user: session.user };
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { user } = Route.useRouteContext();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	return (
		<div className="flex min-h-screen bg-white font-sans text-sm text-[#09090b]">
			{/* Sidebar */}
			<aside className="w-64 border-r border-[#e4e4e7] bg-[#fafafa] flex flex-col justify-between p-4 shrink-0">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-1 px-2 py-3 border-b border-[#e4e4e7]">
						<h1 className="font-semibold text-base leading-tight">
							Sarpras Admin
						</h1>
						<p className="text-xs text-[#71717a] truncate">{user.email}</p>
						<span className="mt-1 self-start px-2 py-0.5 bg-[#e4e4e7] text-[#09090b] text-[10px] font-semibold uppercase rounded">
							{user.role}
						</span>
					</div>

					<nav className="flex flex-col gap-1">
						<Link
							to="/admin"
							activeOptions={{ exact: true }}
							activeProps={{ className: "bg-[#09090b] text-white!" }}
							inactiveProps={{
								className:
									"text-[#71717a] hover:bg-[#e4e4e7] hover:text-[#09090b]",
							}}
							className="flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors"
						>
							<LayoutDashboard size={18} />
							<span>Dashboard</span>
						</Link>

						<Link
							to="/admin/bookings"
							activeProps={{ className: "bg-[#09090b] text-white!" }}
							inactiveProps={{
								className:
									"text-[#71717a] hover:bg-[#e4e4e7] hover:text-[#09090b]",
							}}
							className="flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors"
						>
							<CalendarCheck2 size={18} />
							<span>Permohonan Booking</span>
						</Link>

						<Link
							to="/admin/calendar"
							activeProps={{ className: "bg-[#09090b] text-white!" }}
							inactiveProps={{
								className:
									"text-[#71717a] hover:bg-[#e4e4e7] hover:text-[#09090b]",
							}}
							className="flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors"
						>
							<Calendar size={18} />
							<span>Kalender Operasional</span>
						</Link>

						<Link
							to="/admin/assets"
							activeProps={{ className: "bg-[#09090b] text-white!" }}
							inactiveProps={{
								className:
									"text-[#71717a] hover:bg-[#e4e4e7] hover:text-[#09090b]",
							}}
							className="flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors"
						>
							<Building2 size={18} />
							<span>Manajemen Aset</span>
						</Link>

						<Link
							to="/admin/users"
							activeProps={{ className: "bg-[#09090b] text-white!" }}
							inactiveProps={{
								className:
									"text-[#71717a] hover:bg-[#e4e4e7] hover:text-[#09090b]",
							}}
							className="flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors"
						>
							<Users size={18} />
							<span>Manajemen Pengguna</span>
						</Link>

						<Link
							to="/admin/audit"
							activeProps={{ className: "bg-[#09090b] text-white!" }}
							inactiveProps={{
								className:
									"text-[#71717a] hover:bg-[#e4e4e7] hover:text-[#09090b]",
							}}
							className="flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors"
						>
							<ScrollText size={18} />
							<span>Riwayat Audit</span>
						</Link>
					</nav>
				</div>

				<button
					type="button"
					onClick={handleLogout}
					className="flex items-center gap-3 px-3 py-2 rounded-md font-medium text-[#e11d48] hover:bg-[#fef2f2] transition-colors w-full text-left outline-none cursor-pointer"
				>
					<LogOut size={18} />
					<span>Keluar (Sign Out)</span>
				</button>
			</aside>

      {/* Main Content */}
      <main className="flex-1 bg-white p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
