import { RotateCcw, Search } from "lucide-react";

export interface BookingsFilterState {
	status: "all" | "pending" | "approved" | "rejected" | "cancelled";
	assetType: "all" | "room" | "dormitory" | "vehicle" | "field" | "equipment";
	startDate?: string;
	endDate?: string;
	search?: string;
}

interface BookingsFilterBarProps {
	filters: BookingsFilterState;
	onChange: (updated: Partial<BookingsFilterState>) => void;
	onReset: () => void;
}

export function BookingsFilterBar({
	filters,
	onChange,
	onReset,
}: BookingsFilterBarProps) {
	const statusTabs = [
		{ id: "all", label: "Semua" },
		{ id: "pending", label: "Menunggu (Pending)" },
		{ id: "approved", label: "Disetujui" },
		{ id: "rejected", label: "Ditolak" },
		{ id: "cancelled", label: "Dibatalkan" },
	] as const;

	const hasActiveFilters =
		filters.status !== "all" ||
		filters.assetType !== "all" ||
		Boolean(filters.search?.trim()) ||
		Boolean(filters.startDate) ||
		Boolean(filters.endDate);

	return (
		<div className="bg-card p-4 border border-border rounded-xl shadow-xs flex flex-col gap-4">
			{/* Status Tabs Bar */}
			<div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 md:pb-0 border-b border-border">
				<div className="flex items-center gap-1">
					{statusTabs.map((tab) => {
						const isActive = filters.status === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => onChange({ status: tab.id })}
								className={`px-3 py-2 text-xs font-semibold rounded-t-md transition-colors border-b-2 -mb-[1px] cursor-pointer ${
									isActive
										? "border-primary text-foreground bg-muted/40 font-bold"
										: "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>

				{hasActiveFilters && (
					<button
						type="button"
						onClick={onReset}
						className="text-xs font-medium text-muted-foreground hover:text-destructive flex items-center gap-1 px-2.5 py-1 rounded hover:bg-destructive/10 transition-colors cursor-pointer"
					>
						<RotateCcw size={13} />
						<span>Reset Filter</span>
					</button>
				)}
			</div>

			{/* Filter Controls Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
				{/* Search Input */}
				<div className="relative">
					<Search
						size={15}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						placeholder="Cari kode booking, nama pemohon, instansi..."
						value={filters.search || ""}
						onChange={(e) => onChange({ search: e.target.value })}
						className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
					/>
				</div>

				{/* Asset Type Select */}
				<div>
					<select
						value={filters.assetType}
						onChange={(e) =>
							onChange({
								assetType: e.target.value as any,
							})
						}
						aria-label="Filter berdasarkan tipe aset"
						className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
					>
						<option value="all">Semua Tipe Fasilitas</option>
						<option value="room">Ruangan</option>
						<option value="dormitory">Asrama</option>
						<option value="vehicle">Kendaraan</option>
						<option value="field">Lapangan</option>
						<option value="equipment">Peralatan</option>
					</select>
				</div>

				{/* Start Date */}
				<div>
					<input
						type="date"
						value={filters.startDate || ""}
						onChange={(e) =>
							onChange({ startDate: e.target.value || undefined })
						}
						aria-label="Tanggal Mulai"
						className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
					/>
				</div>

				{/* End Date */}
				<div>
					<input
						type="date"
						value={filters.endDate || ""}
						onChange={(e) => onChange({ endDate: e.target.value || undefined })}
						aria-label="Tanggal Selesai"
						className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
					/>
				</div>
			</div>
		</div>
	);
}
