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
			<div className="flex h-64 items-center justify-center bg-white">
				<div className="text-sm font-medium text-[#71717a] animate-pulse">
					Memuat indikator operasional dashboard...
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex flex-col gap-2">
				<h4 className="font-semibold text-sm">Terjadi Kesalahan Memuat Data</h4>
				<p className="text-xs">{error || "Data tidak dapat dimuat."}</p>
				<button
					type="button"
					onClick={loadDashboard}
					className="self-start px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-md hover:bg-rose-700 mt-2"
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
					<h2 className="text-2xl font-bold tracking-tight text-[#09090b]">
						Dashboard Operasional
					</h2>
					<p className="text-xs text-[#71717a]">
						Ringkasan metrik peminjaman sarana dan prasarana PPKASN
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/admin/bookings"
						className="px-3.5 py-2 bg-[#09090b] text-white text-xs font-medium rounded-lg hover:bg-[#27272a] transition-colors flex items-center gap-2 shadow-xs"
					>
						<CalendarCheck2 size={16} />
						<span>Kelola Booking</span>
					</Link>
					<Link
						to="/admin/calendar"
						className="px-3.5 py-2 bg-[#f4f4f5] text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#e4e4e7] transition-colors flex items-center gap-2"
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
					<div className="p-6 bg-[#fafafa] border border-[#e4e4e7] rounded-xl flex flex-col gap-4">
						<h3 className="font-semibold text-sm text-[#09090b]">
							Aksi & Navigasi Cepat
						</h3>
						<div className="flex flex-col gap-2">
							<Link
								to="/admin/bookings"
								search={{ status: "pending" }}
								className="p-3 bg-white border border-[#e4e4e7] rounded-lg hover:border-[#09090b] transition-all flex items-center justify-between text-xs font-medium text-[#09090b]"
							>
								<div className="flex items-center gap-2.5">
									<Clock size={16} className="text-amber-600" />
									<span>Filter Permohonan Pending</span>
								</div>
								<ArrowUpRight size={14} className="text-[#71717a]" />
							</Link>

							<Link
								to="/admin/calendar"
								className="p-3 bg-white border border-[#e4e4e7] rounded-lg hover:border-[#09090b] transition-all flex items-center justify-between text-xs font-medium text-[#09090b]"
							>
								<div className="flex items-center gap-2.5">
									<Building2 size={16} className="text-blue-600" />
									<span>Lihat Jadwal Ruang & Asrama</span>
								</div>
								<ArrowUpRight size={14} className="text-[#71717a]" />
							</Link>

							{(currentUser as any)?.role === "admin" && (
								<Link
									to="/admin/audit"
									className="p-3 bg-white border border-[#e4e4e7] rounded-lg hover:border-[#09090b] transition-all flex items-center justify-between text-xs font-medium text-[#09090b]"
								>
									<div className="flex items-center gap-2.5">
										<ScrollText size={16} className="text-zinc-600" />
										<span>Periksa Riwayat Audit Sistem</span>
									</div>
									<ArrowUpRight size={14} className="text-[#71717a]" />
								</Link>
							)}
						</div>
					</div>

					<div className="p-5 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col gap-2">
						<div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
							<AlertTriangle size={15} />
							<span>Petunjuk Operasional</span>
						</div>
						<p className="text-xs text-blue-800 leading-relaxed">
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
