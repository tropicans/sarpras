import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowUpRight,
	Building2,
	CalendarCheck2,
	CalendarX,
	Clock,
	ScrollText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { KpiCard } from "#/components/admin/kpi-card";
import { UrgentBookingsWidget } from "#/components/admin/urgent-bookings-widget";
import { getAdminDashboardOverviewFn } from "#/lib/booking/admin-fns.functions";

export const Route = createFileRoute("/admin/")({
	component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
	const { user: currentUser } = Route.useRouteContext();
	const [data, setData] = useState<{
		kpi: {
			pendingActionCount: number;
			approvedThisMonthCount: number;
			activeAssetsCount: number;
			activeClosuresCount: number;
		};
		urgentPending: Array<any>;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadDashboard = () => {
		setLoading(true);
		setError(null);
		getAdminDashboardOverviewFn()
			.then(setData)
			.catch((err) => setError(err.message || "Gagal memuat data dashboard"))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center bg-background">
				<div className="text-sm font-medium text-muted-foreground animate-pulse">
					Memuat indikator operasional dashboard...
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex flex-col gap-2">
				<h4 className="font-semibold text-sm">Terjadi Kesalahan Memuat Data</h4>
				<p className="text-xs">{error || "Data tidak dapat dimuat."}</p>
				<button
					type="button"
					onClick={loadDashboard}
					className="self-start px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium rounded-md hover:opacity-90 mt-2"
				>
					Coba Lagi
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8 max-w-7xl">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Dashboard Operasional
					</h2>
					<p className="text-xs text-muted-foreground">
						Ringkasan metrik peminjaman sarana dan prasarana PPKASN
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/admin/bookings"
						className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<CalendarCheck2 size={16} />
						<span>Kelola Booking</span>
					</Link>
					<Link
						to="/admin/calendar"
						className="px-3.5 py-2 bg-muted border border-border text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2 cursor-pointer"
					>
						<span>Kalender</span>
						<ArrowUpRight size={14} />
					</Link>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<KpiCard
					title="Perlu Tindakan"
					value={data.kpi.pendingActionCount}
					icon={Clock}
					subtext={
						data.kpi.pendingActionCount > 0
							? "Permohonan menunggu persetujuan"
							: "Semua antrean bersih"
					}
					variant={data.kpi.pendingActionCount > 0 ? "amber" : "default"}
				/>
				<KpiCard
					title="Disetujui Bulan Ini"
					value={data.kpi.approvedThisMonthCount}
					icon={CalendarCheck2}
					subtext="Peminjaman aktif disetujui"
					variant="emerald"
				/>
				<KpiCard
					title="Total Aset Aktif"
					value={data.kpi.activeAssetsCount}
					icon={Building2}
					subtext="Ruang rapat & asrama tersedia"
					variant="blue"
				/>
				<KpiCard
					title="Penutupan Aktif"
					value={data.kpi.activeClosuresCount}
					icon={CalendarX}
					subtext="Jadwal pemeliharaan mendatang"
					variant={data.kpi.activeClosuresCount > 0 ? "rose" : "default"}
				/>
			</div>

			{/* Urgent Action Queue & Quick Shortcuts */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2">
					<UrgentBookingsWidget items={data.urgentPending} />
				</div>

				<div className="flex flex-col gap-4">
					<div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4 shadow-xs">
						<h3 className="font-semibold text-sm text-foreground">
							Aksi & Navigasi Cepat
						</h3>
						<div className="flex flex-col gap-2">
							<Link
								to="/admin/bookings"
								search={{ status: "pending" }}
								className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-all flex items-center justify-between text-xs font-medium text-foreground cursor-pointer"
							>
								<div className="flex items-center gap-2.5">
									<Clock size={16} className="text-amber-500" />
									<span>Filter Permohonan Pending</span>
								</div>
								<ArrowUpRight size={14} className="text-muted-foreground" />
							</Link>

							<Link
								to="/admin/calendar"
								className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-all flex items-center justify-between text-xs font-medium text-foreground cursor-pointer"
							>
								<div className="flex items-center gap-2.5">
									<Building2 size={16} className="text-blue-500" />
									<span>Lihat Jadwal Ruang & Asrama</span>
								</div>
								<ArrowUpRight size={14} className="text-muted-foreground" />
							</Link>

							{(currentUser as any)?.role === "admin" && (
								<Link
									to="/admin/audit"
									className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-all flex items-center justify-between text-xs font-medium text-foreground cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<ScrollText size={16} className="text-muted-foreground" />
										<span>Periksa Riwayat Audit Sistem</span>
									</div>
									<ArrowUpRight size={14} className="text-muted-foreground" />
								</Link>
							)}
						</div>
					</div>

					<div className="p-5 bg-sky-500/10 border border-sky-500/20 rounded-xl flex flex-col gap-2">
						<div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-semibold text-xs">
							<AlertTriangle size={15} />
							<span>Petunjuk Operasional</span>
						</div>
						<p className="text-xs text-sky-700 dark:text-sky-300/90 leading-relaxed">
							Setiap persetujuan atau penolakan permohonan akan secara otomatis
							tercatat dalam riwayat audit sistem dan mengunci slot jadwal
							secara transaksional.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
