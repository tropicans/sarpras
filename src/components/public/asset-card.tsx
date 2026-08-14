import { Link } from "@tanstack/react-router";
import {
	BedDouble,
	Building,
	Calendar,
	DoorOpen,
	MapPin,
	Users,
} from "lucide-react";

export interface PublicAssetItem {
	id: string;
	name: string;
	type: string;
	location: string | null;
	capacity: number;
	status: string;
}

interface AssetCardProps {
	asset: PublicAssetItem;
	onViewSchedule: (asset: PublicAssetItem) => void;
}

export function AssetCard({ asset, onViewSchedule }: AssetCardProps) {
	const isRoom = asset.type === "room";

	return (
		<div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
			<div className="space-y-4">
				{/* Top Badges */}
				<div className="flex items-center justify-between gap-2">
					<span
						className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
							isRoom
								? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
								: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
						}`}
					>
						{isRoom ? (
							<DoorOpen className="h-3.5 w-3.5" />
						) : (
							<BedDouble className="h-3.5 w-3.5" />
						)}
						{isRoom ? "Ruang Rapat" : "Asrama / Wisma"}
					</span>

					<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
						Tersedia
					</span>
				</div>

				{/* Asset Title & Location */}
				<div className="space-y-1">
					<h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
						{asset.name}
					</h3>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
						<span>{asset.location || "Gedung Utama PPKASN"}</span>
					</div>
				</div>

				{/* Capacity & Highlights */}
				<div className="flex items-center gap-3 pt-1 text-xs text-foreground/80">
					<div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 font-medium">
						<Users className="h-3.5 w-3.5 text-primary" />
						<span>Kapasitas {asset.capacity} Orang</span>
					</div>
					<div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 font-medium">
						<Building className="h-3.5 w-3.5 text-primary" />
						<span>{isRoom ? "Full AC & Audio" : "Kamar & Kasur"}</span>
					</div>
				</div>
			</div>

			{/* Action CTA Buttons */}
			<div className="mt-6 grid grid-cols-2 gap-2.5 pt-4 border-t border-border/60">
				<button
					type="button"
					onClick={() => onViewSchedule(asset)}
					className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted transition-colors cursor-pointer"
				>
					<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
					Lihat Jadwal
				</button>
				<Link
					to={`/book/${asset.id}`}
					className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-all cursor-pointer text-center"
				>
					Ajukan Pinjam
				</Link>
			</div>
		</div>
	);
}
