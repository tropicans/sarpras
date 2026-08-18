import {
	ChevronLeft,
	ChevronRight,
	Filter,
	RotateCcw,
	ScrollText,
	Search,
} from "lucide-react";
import { formatJakartaDisplay } from "#/lib/timezone/datetime";
import { AuditDiffViewer } from "./audit-diff-viewer";

export interface AuditFilterState {
	action: string;
	entityType: "all" | "booking" | "asset" | "user";
	actorId?: string;
	startDate?: string;
	endDate?: string;
	page: number;
}

interface AuditTableProps {
	items: Array<any>;
	total: number;
	page: number;
	totalPages: number;
	limit: number;
	filters: AuditFilterState;
	onFilterChange: (updated: Partial<AuditFilterState>) => void;
	onResetFilters: () => void;
	loading?: boolean;
}

const ACTION_OPTIONS = [
	{ value: "all", label: "Semua Aksi" },
	{ value: "booking.create", label: "booking.create (Permohonan Baru)" },
	{ value: "booking.approve", label: "booking.approve (Persetujuan)" },
	{ value: "booking.reject", label: "booking.reject (Penolakan)" },
	{ value: "booking.cancel", label: "booking.cancel (Pembatalan)" },
	{ value: "asset.create", label: "asset.create (Aset Baru)" },
	{ value: "asset.update", label: "asset.update (Pembaruan Aset)" },
	{ value: "user.update", label: "user.update (Pembaruan Pengguna)" },
	{ value: "user.deactivate", label: "user.deactivate (Penonaktifan Akun)" },
];

export function AuditTable({
	items,
	total,
	page,
	totalPages,
	limit,
	filters,
	onFilterChange,
	onResetFilters,
	loading = false,
}: AuditTableProps) {
	const hasActiveFilters =
		filters.action !== "all" ||
		filters.entityType !== "all" ||
		Boolean(filters.actorId?.trim()) ||
		Boolean(filters.startDate) ||
		Boolean(filters.endDate);

	return (
		<div className="flex flex-col gap-4">
			{/* Filters Bar */}
			<div className="p-4 bg-card border border-border rounded-xl shadow-xs flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Filter size={15} className="text-muted-foreground" />
						<span className="text-xs font-bold text-foreground">
							Filter Riwayat Audit
						</span>
					</div>

					{hasActiveFilters && (
						<button
							type="button"
							onClick={onResetFilters}
							className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer"
						>
							<RotateCcw size={12} />
							<span>Reset Filter</span>
						</button>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{/* Action Selector */}
					<div>
						<select
							value={filters.action}
							onChange={(e) =>
								onFilterChange({ action: e.target.value, page: 1 })
							}
							aria-label="Filter Tipe Aksi"
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer font-medium"
						>
							{ACTION_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>

					{/* Entity Type Selector */}
					<div>
						<select
							value={filters.entityType}
							onChange={(e) =>
								onFilterChange({
									entityType: e.target.value as any,
									page: 1,
								})
							}
							aria-label="Filter Tipe Entitas"
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer font-medium"
						>
							<option value="all">Semua Tipe Entitas</option>
							<option value="booking">Booking (Peminjaman)</option>
							<option value="asset">Aset Fasilitas</option>
							<option value="user">Pengguna (User)</option>
						</select>
					</div>

					{/* Actor Search Input */}
					<div className="relative">
						<Search
							size={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						/>
						<input
							type="text"
							placeholder="Cari ID/Email Aktor..."
							value={filters.actorId || ""}
							onChange={(e) =>
								onFilterChange({ actorId: e.target.value, page: 1 })
							}
							className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
						/>
					</div>

					{/* Start Date */}
					<div>
						<input
							type="date"
							value={filters.startDate || ""}
							onChange={(e) =>
								onFilterChange({
									startDate: e.target.value || undefined,
									page: 1,
								})
							}
							aria-label="Tanggal Dari"
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
						/>
					</div>
				</div>
			</div>

			{/* Audit Log Table */}
			<div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold text-[11px]">
							<tr>
								<th className="py-3 px-4">Waktu (WIB)</th>
								<th className="py-3 px-4">Aksi</th>
								<th className="py-3 px-4">Aktor / Pelaku</th>
								<th className="py-3 px-4">Entitas</th>
								<th className="py-3 px-4">Rincian Perubahan / Metadata</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{loading && (
								<tr>
									<td
										colSpan={5}
										className="py-12 text-center text-muted-foreground font-medium"
									>
										Memuat riwayat audit sistem...
									</td>
								</tr>
							)}

							{!loading && items.length === 0 && (
								<tr>
									<td
										colSpan={5}
										className="py-16 text-center text-muted-foreground"
									>
										<div className="flex flex-col items-center justify-center gap-2">
											<ScrollText
												size={32}
												className="text-muted-foreground/60"
											/>
											<span className="font-semibold text-sm text-foreground">
												Tidak Ada Catatan Audit
											</span>
											<span className="text-xs">
												Belum ada catatan aktivitas yang cocok dengan filter
												yang dipilih.
											</span>
										</div>
									</td>
								</tr>
							)}

							{!loading &&
								items.map((log) => (
									<tr
										key={log.id}
										className="hover:bg-muted/30 transition-colors"
									>
										{/* Waktu */}
										<td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
											<div className="flex flex-col">
												<span className="font-semibold text-foreground">
													{formatJakartaDisplay(log.createdAt, "dd MMM yyyy")}
												</span>
												<span className="text-[11px]">
													{formatJakartaDisplay(
														log.createdAt,
														"HH:mm:ss 'WIB'",
													)}
												</span>
											</div>
										</td>

										{/* Aksi Badge */}
										<td className="py-3 px-4 whitespace-nowrap">
											<span
												className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
													log.action.includes("approve")
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
														: log.action.includes("reject") ||
																log.action.includes("cancel")
															? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
															: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
												}`}
											>
												{log.action}
											</span>
										</td>

										{/* Aktor */}
										<td className="py-3 px-4 whitespace-nowrap">
											<div className="flex flex-col">
												<span className="font-semibold text-foreground">
													{log.actorName || log.actorId}
												</span>
												<span className="text-[10px] text-muted-foreground capitalize">
													{log.actorType}{" "}
													{log.actorEmail ? `(${log.actorEmail})` : ""}
												</span>
											</div>
										</td>

										{/* Entitas */}
										<td className="py-3 px-4 whitespace-nowrap">
											<div className="flex flex-col">
												<span className="font-semibold text-foreground capitalize">
													{log.entityType}
												</span>
												{log.entityId && (
													<span className="text-[10px] text-muted-foreground font-mono">
														{log.entityId.slice(0, 8)}...
													</span>
												)}
											</div>
										</td>

										{/* Metadata / Diff */}
										<td className="py-3 px-4 min-w-[300px]">
											<AuditDiffViewer
												action={log.action}
												entityType={log.entityType}
												entityId={log.entityId}
												metadata={log.metadata}
											/>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/40">
						<span>
							Menampilkan {(page - 1) * limit + 1} -{" "}
							{Math.min(page * limit, total)} dari {total} log audit
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => onFilterChange({ page: page - 1 })}
								disabled={page <= 1}
								className="px-2.5 py-1.5 border border-border rounded bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted flex items-center gap-1 cursor-pointer"
							>
								<ChevronLeft size={14} />
								<span>Sebelumnya</span>
							</button>
							<span className="font-semibold text-foreground">
								Halaman {page} / {totalPages}
							</span>
							<button
								type="button"
								onClick={() => onFilterChange({ page: page + 1 })}
								disabled={page >= totalPages}
								className="px-2.5 py-1.5 border border-border rounded bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted flex items-center gap-1 cursor-pointer"
							>
								<span>Selanjutnya</span>
								<ChevronRight size={14} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
