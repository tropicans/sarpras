import { Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowUpRight,
	BedDouble,
	Building,
	Calendar,
	Car,
	CheckCircle2,
	Clock,
	DoorOpen,
	MapPin,
	Package,
	XCircle,
} from "lucide-react";
import { ASSET_TYPE_LABELS, type AssetType } from "#/lib/booking/types";

export interface PublicAssetItem {
	id: string;
	name: string;
	type: string;
	location: string | null;
	capacity: number;
	status: string;
}

export interface AssetAvailabilityStatus {
	available: boolean;
	reason?: string;
	bookedSessions?: { startDate: string; endDate: string }[];
}

interface AssetCardProps {
	asset: PublicAssetItem;
	onViewSchedule: (asset: PublicAssetItem) => void;
	availability?: AssetAvailabilityStatus;
	isFilteredByDate?: boolean;
}

export function AssetCard({
	asset,
	onViewSchedule,
	availability,
	isFilteredByDate = false,
}: AssetCardProps) {
	const typeLabel =
		ASSET_TYPE_LABELS[asset.type as AssetType] || asset.type.toUpperCase();

	const getTypeIcon = () => {
		switch (asset.type) {
			case "room":
				return <DoorOpen className="h-4 w-4" />;
			case "dormitory":
				return <BedDouble className="h-4 w-4" />;
			case "vehicle":
				return <Car className="h-4 w-4" />;
			case "equipment":
				return <Package className="h-4 w-4" />;
			default:
				return <Building className="h-4 w-4" />;
		}
	};

	const getVisualTheme = () => {
		switch (asset.type) {
			case "room":
				return {
					gradient: "from-sky-500/20 via-sky-500/5 to-transparent",
					accentBorder: "group-hover:border-sky-500/50",
					badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
					iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
					tags: ["Hybrid Video", "Proyektor 4K", "Wi-Fi 6"],
				};
			case "dormitory":
				return {
					gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
					accentBorder: "group-hover:border-indigo-500/50",
					badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
					iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
					tags: ["Twin/Single Bed", "AC & Water Heater", "Full Meja Kerja"],
				};
			case "vehicle":
				return {
					gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
					accentBorder: "group-hover:border-emerald-500/50",
					badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
					iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
					tags: ["Pengemudi Dinas", "AC Dingin", "Asuransi Perjalanan"],
				};
			case "field":
				return {
					gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
					accentBorder: "group-hover:border-amber-500/50",
					badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
					iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
					tags: ["Pencahayaan LED", "Sound Portable", "Outdoor Siap"],
				};
			default:
				return {
					gradient: "from-primary/20 via-primary/5 to-transparent",
					accentBorder: "group-hover:border-primary/50",
					badge: "border-primary/30 bg-primary/10 text-primary",
					iconBg: "bg-primary/10 text-primary",
					tags: ["Kondisi Prima", "Terawat", "Teknisi Siap"],
				};
		}
	};

	const theme = getVisualTheme();
	const shortId = asset.id.slice(0, 6).toUpperCase();

	// Availability state
	const isAvailable = availability ? availability.available : true;

	return (
		<div
			className={`group relative flex flex-col justify-between rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
				isFilteredByDate
					? isAvailable
						? "border-emerald-500/40 shadow-emerald-500/5 hover:border-emerald-500"
						: "border-destructive/30 opacity-90 hover:border-destructive/50"
					: `border-border ${theme.accentBorder}`
			}`}
		>
			{/* Top Visual Graphic Banner */}
			<div
				className={`relative h-28 w-full bg-gradient-to-br ${theme.gradient} border-b border-border/60 p-3.5 flex flex-col justify-between overflow-hidden`}
			>
				{/* Background Tech Pattern SVG */}
				<div className="absolute inset-0 opacity-15 pointer-events-none">
					<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<pattern
								id={`grid-${asset.id}`}
								width="16"
								height="16"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M 16 0 L 0 0 0 16"
									fill="none"
									stroke="currentColor"
									strokeWidth="0.75"
								/>
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill={`url(#grid-${asset.id})`} />
					</svg>
				</div>

				{/* Top Spec Header Bar */}
				<div className="relative z-10 flex items-center justify-between gap-2">
					<span
						className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-tight shadow-2xs backdrop-blur-md ${theme.badge}`}
					>
						{getTypeIcon()}
						<span>{typeLabel.toUpperCase()}</span>
					</span>

					{/* Live Availability Badge */}
					{isFilteredByDate ? (
						isAvailable ? (
							<div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 backdrop-blur-md shadow-xs">
								<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
								<span>TERSEDIA</span>
							</div>
						) : (
							<div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-destructive backdrop-blur-md shadow-xs">
								<span className="h-2 w-2 rounded-full bg-destructive" />
								<span>TERPAKAI</span>
							</div>
						)
					) : (
						<div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-card/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
							<span>READY</span>
						</div>
					)}
				</div>

				{/* Center Facility Graphic Representation */}
				<div className="relative z-10 flex items-end justify-between">
					<div className="flex items-center gap-2">
						<div
							className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-card/90 shadow-2xs transition-transform duration-200 group-hover:scale-110 ${theme.iconBg}`}
						>
							{getTypeIcon()}
						</div>
						<div className="font-mono text-[10px] text-muted-foreground">
							REF: <span className="text-foreground font-semibold">#{shortId}</span>
						</div>
					</div>

					<div className="font-mono text-[11px] font-bold text-foreground bg-card/80 px-2 py-0.5 rounded border border-border/70 backdrop-blur-xs">
						{asset.capacity}{" "}
						<span className="font-normal text-[10px] text-muted-foreground">
							{asset.type === "vehicle" || asset.type === "equipment"
								? "Unit"
								: "Pax"}
						</span>
					</div>
				</div>
			</div>

			{/* Card Body */}
			<div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
				<div className="space-y-2">
					{/* Title & Location */}
					<div className="space-y-1">
						<h3 className="text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary leading-snug">
							{asset.name}
						</h3>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
							<span className="truncate">
								{asset.location || "PPKASN Kemensetneg RI"}
							</span>
						</div>
					</div>

					{/* Date Filter Context Banner */}
					{isFilteredByDate && (
						<div
							className={`rounded-md p-2 text-xs font-mono flex items-start gap-2 border ${
								isAvailable
									? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
									: "bg-destructive/10 border-destructive/20 text-destructive"
							}`}
						>
							{isAvailable ? (
								<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
							) : (
								<XCircle className="h-4 w-4 shrink-0 mt-0.5" />
							)}
							<div>
								<span className="font-semibold block text-[11px]">
									{isAvailable
										? "KOSONG // BISA DIPINJAM"
										: "SUDAH TERPAKAI PADA JAM INI"}
								</span>
								<span className="text-[10px] opacity-90">
									{isAvailable
										? "Jadwal kosong dan siap dipesan untuk kegiatan Anda."
										: availability?.reason ||
											"Telah terisi permohonan lain pada rentang waktu ini."}
								</span>
							</div>
						</div>
					)}

					{/* Visual Feature Tags */}
					<div className="flex flex-wrap gap-1 pt-1">
						{theme.tags.map((tag, idx) => (
							<span
								key={idx}
								className="inline-flex items-center rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
							>
								{tag}
							</span>
						))}
					</div>
				</div>

				{/* Action CTA Buttons */}
				<div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => onViewSchedule(asset)}
						className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer shadow-2xs"
					>
						<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
						<span>Cek Jadwal</span>
					</button>

					<Link
						to="/book/$assetId"
						params={{ assetId: asset.id }}
						className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer shadow-2xs group/btn ${
							isFilteredByDate && !isAvailable
								? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
								: "bg-primary text-primary-foreground hover:bg-primary/90"
						}`}
					>
						<span>{isFilteredByDate && !isAvailable ? "Pilih Sesi Lain" : "Pinjam"}</span>
						<ArrowUpRight className="h-3.5 w-3.5 opacity-80 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
					</Link>
				</div>
			</div>
		</div>
	);
}

