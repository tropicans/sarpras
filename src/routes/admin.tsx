import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import {
	Building2,
	Calendar,
	CalendarCheck2,
	LayoutDashboard,
	LogOut,
	ScrollText,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { TwoFactorSetupModal } from "#/components/admin/two-factor-setup-modal";
import { ThemeToggle } from "#/components/ui/theme-toggle";
import { getSessionFn } from "#/lib/auth.middleware";
import { authClient } from "#/lib/auth-client";

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
	const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
	const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(
		(user as any)?.twoFactorEnabled ?? false,
	);

	const handleLogout = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	return (
		<div className="flex min-h-screen bg-background font-sans text-xs text-foreground selection:bg-primary/20">
			{/* Sidebar (TanStack/Aside console sidebar) */}
			<aside className="w-60 border-r border-border bg-card/60 flex flex-col justify-between p-3.5 shrink-0 transition-colors">
				<div className="flex flex-col gap-5">
					{/* Brand & User Profile */}
					<div className="flex flex-col gap-1.5 pb-3 border-b border-border">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
									<Building2 size={14} />
								</div>
								<div className="flex flex-col">
									<span className="font-mono text-xs font-bold tracking-wider text-foreground">
										SARPRAS // PPKASN
									</span>
									<span className="text-[10px] text-muted-foreground font-mono">
										CONSOLE v1.0
									</span>
								</div>
							</div>
							<ThemeToggle className="h-7 w-7" />
						</div>

						<div className="mt-2 rounded border border-border/60 bg-muted/40 p-2 font-mono">
							<p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
							<div className="mt-1 flex items-center justify-between">
								<span className="inline-flex items-center rounded border border-primary/30 bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">
									{user.role === "admin"
										? "ADMINISTRATOR"
										: user.role === "pimpinan"
											? "PIMPINAN"
											: "OPERATOR"}
								</span>
								<div className="flex items-center gap-1 text-[9px] text-emerald-500 font-mono">
									<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
									<span>ONLINE</span>
								</div>
							</div>
						</div>
					</div>

					{/* Navigation Links */}
					<nav className="flex flex-col gap-1 font-mono">
						<Link
							to="/admin"
							activeOptions={{ exact: true }}
							activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-2xs!" }}
							inactiveProps={{
								className:
									"text-muted-foreground hover:bg-muted hover:text-foreground",
							}}
							className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
						>
							<LayoutDashboard size={15} />
							<span>DASHBOARD</span>
						</Link>

						<Link
							to="/admin/bookings"
							activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-2xs!" }}
							inactiveProps={{
								className:
									"text-muted-foreground hover:bg-muted hover:text-foreground",
							}}
							className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
						>
							<CalendarCheck2 size={15} />
							<span>PERMOHONAN</span>
						</Link>

						<Link
							to="/admin/calendar"
							activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-2xs!" }}
							inactiveProps={{
								className:
									"text-muted-foreground hover:bg-muted hover:text-foreground",
							}}
							className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
						>
							<Calendar size={15} />
							<span>KALENDER</span>
						</Link>

						<Link
							to="/admin/assets"
							activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-2xs!" }}
							inactiveProps={{
								className:
									"text-muted-foreground hover:bg-muted hover:text-foreground",
							}}
							className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
						>
							<Building2 size={15} />
							<span>MANAJEMEN ASET</span>
						</Link>

						{user.role === "admin" && (
							<Link
								to="/admin/users"
								activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-2xs!" }}
								inactiveProps={{
									className:
										"text-muted-foreground hover:bg-muted hover:text-foreground",
								}}
								className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
							>
								<Users size={15} />
								<span>PENGGUNA</span>
							</Link>
						)}

						{user.role === "admin" && (
							<Link
								to="/admin/audit"
								activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-2xs!" }}
								inactiveProps={{
									className:
										"text-muted-foreground hover:bg-muted hover:text-foreground",
								}}
								className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
							>
								<ScrollText size={15} />
								<span>AUDIT LOG</span>
							</Link>
						)}
					</nav>
				</div>

				<div className="pt-3 border-t border-border font-mono flex flex-col gap-1">
					<button
						type="button"
						onClick={() => setTwoFactorModalOpen(true)}
						className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full text-left cursor-pointer"
					>
						<div className="flex items-center gap-2">
							<ShieldCheck size={15} className={isTwoFactorEnabled ? "text-emerald-500" : "text-zinc-400"} />
							<span>KEAMANAN 2FA</span>
						</div>
						<span
							className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
								isTwoFactorEnabled
									? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
									: "bg-muted text-muted-foreground"
							}`}
						>
							{isTwoFactorEnabled ? "AKTIF" : "OFF"}
						</span>
					</button>

					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-rose-500 hover:bg-rose-500/10 transition-colors w-full text-left cursor-pointer"
					>
						<LogOut size={15} />
						<span>KELUAR (SIGN OUT)</span>
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 bg-background p-6 lg:p-8 overflow-y-auto">
				<Outlet />
			</main>

			{/* Two-Factor Authentication Setup / Management Modal */}
			<TwoFactorSetupModal
				isOpen={twoFactorModalOpen}
				onClose={() => setTwoFactorModalOpen(false)}
				userTwoFactorEnabled={isTwoFactorEnabled}
				onStatusChange={(enabled) => setIsTwoFactorEnabled(enabled)}
			/>
		</div>
	);
}
