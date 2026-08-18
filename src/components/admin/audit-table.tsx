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
			<div className="p-4 bg-white border border-[#e4e4e7] rounded-xl shadow-xs flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Filter size={15} className="text-[#71717a]" />
						<span className="text-xs font-bold text-[#09090b]">
							Filter Riwayat Audit
						</span>
					</div>

					{hasActiveFilters && (
						<button
							type="button"
							onClick={onResetFilters}
							className="text-xs text-[#71717a] hover:text-rose-600 flex items-center gap-1 cursor-pointer"
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
							className="w-full px-3 py-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] focus:outline-none focus:border-[#09090b] cursor-pointer"
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
							className="w-full px-3 py-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] focus:outline-none focus:border-[#09090b] cursor-pointer"
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
							className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]"
						/>
						<input
							type="text"
							placeholder="Cari ID/Email Aktor..."
							value={filters.actorId || ""}
							onChange={(e) =>
								onFilterChange({ actorId: e.target.value, page: 1 })
							}
							className="w-full pl-9 pr-3 py-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#09090b]"
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
							className="w-full px-3 py-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] focus:outline-none focus:border-[#09090b] cursor-pointer"
						/>
					</div>
				</div>
			</div>

			{/* Audit Log Table */}
			<div className="bg-white border border-[#e4e4e7] rounded-xl shadow-xs overflow-hidden flex flex-col">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead className="bg-[#fafafa] border-b border-[#e4e4e7] text-[#71717a] uppercase font-semibold text-[11px]">
							<tr>
								<th className="py-3 px-4">Waktu (WIB)</th>
								<th className="py-3 px-4">Aksi</th>
								<th className="py-3 px-4">Aktor / Pelaku</th>
								<th className="py-3 px-4">Entitas</th>
								<th className="py-3 px-4">Rincian Perubahan / Metadata</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e4e4e7]">
							{loading && (
								<tr>
									<td
										colSpan={5}
										className="py-12 text-center text-[#71717a] font-medium"
									>
										Memuat riwayat audit sistem...
									</td>
								</tr>
							)}

							{!loading && items.length === 0 && (
								<tr>
									<td colSpan={5} className="py-16 text-center text-[#71717a]">
										<div className="flex flex-col items-center justify-center gap-2">
											<ScrollText size={32} className="text-[#a1a1aa]" />
											<span className="font-semibold text-sm text-[#09090b]">
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
										className="hover:bg-[#fafafa] transition-colors"
									>
										{/* Waktu */}
										<td className="py-3 px-4 whitespace-nowrap text-[#71717a]">
											<div className="flex flex-col">
												<span className="font-semibold text-[#09090b]">
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
												className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
													log.action.includes("approve")
														? "bg-emerald-100 text-emerald-800 border border-emerald-200"
														: log.action.includes("reject") ||
																log.action.includes("cancel")
															? "bg-rose-100 text-rose-800 border border-rose-200"
															: "bg-blue-100 text-blue-800 border border-blue-200"
												}`}
											>
												{log.action}
											</span>
										</td>

										{/* Aktor */}
										<td className="py-3 px-4 whitespace-nowrap">
											<div className="flex flex-col">
												<span className="font-semibold text-[#09090b]">
													{log.actorName || log.actorId}
												</span>
												<span className="text-[10px] text-[#71717a] capitalize">
													{log.actorType}{" "}
													{log.actorEmail ? `(${log.actorEmail})` : ""}
												</span>
											</div>
										</td>

										{/* Entitas */}
										<td className="py-3 px-4 whitespace-nowrap">
											<div className="flex flex-col">
												<span className="font-semibold text-[#09090b] capitalize">
													{log.entityType}
												</span>
												{log.entityId && (
													<span className="text-[10px] text-[#71717a] font-mono">
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
					<div className="p-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#71717a] bg-[#fafafa]">
						<span>
							Menampilkan {(page - 1) * limit + 1} -{" "}
							{Math.min(page * limit, total)} dari {total} log audit
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => onFilterChange({ page: page - 1 })}
								disabled={page <= 1}
								className="px-2.5 py-1.5 border border-[#e4e4e7] rounded bg-white text-[#09090b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f4f5] flex items-center gap-1 cursor-pointer"
							>
								<ChevronLeft size={14} />
								<span>Sebelumnya</span>
							</button>
							<span className="font-semibold text-[#09090b]">
								Halaman {page} / {totalPages}
							</span>
							<button
								type="button"
								onClick={() => onFilterChange({ page: page + 1 })}
								disabled={page >= totalPages}
								className="px-2.5 py-1.5 border border-[#e4e4e7] rounded bg-white text-[#09090b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f4f5] flex items-center gap-1 cursor-pointer"
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
