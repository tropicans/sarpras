import { Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	Building2,
	Calendar,
	ExternalLink,
	User,
	Users,
	X,
} from "lucide-react";
import { formatJakartaDisplay } from "#/lib/timezone/datetime";

export interface CalendarEventItem {
	id: string;
	type: "booking" | "closure";
	status: "approved" | "pending" | "closed";
	assetId: string;
	assetName: string;
	assetType: string;
	title: string;
	requesterName: string;
	requesterOrganization?: string | null;
	purpose?: string | null;
	attendance?: number | null;
	startDate: string;
	endDate: string;
}

interface CalendarEventPopoverProps {
	event: CalendarEventItem | null;
	onClose: () => void;
}

export function CalendarEventPopover({
	event,
	onClose,
}: CalendarEventPopoverProps) {
	if (!event) return null;

	const isClosure = event.type === "closure";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
			<div className="bg-card text-foreground rounded-xl max-w-md w-full p-6 shadow-2xl border border-border flex flex-col gap-4">
				{/* Popover Header */}
				<div className="flex items-start justify-between pb-3 border-b border-border">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-sm text-foreground">
								{isClosure ? "Jadwal Penutupan Fasilitas" : "Detail Peminjaman"}
							</h3>
							<span
								className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
									event.status === "approved"
										? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
										: event.status === "closed"
											? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
											: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
								}`}
							>
								{event.status === "approved"
									? "Disetujui"
									: event.status === "closed"
										? "Ditutup"
										: "Pending"}
							</span>
						</div>
						<span className="text-xs text-muted-foreground">{event.assetName}</span>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
					>
						<X size={18} />
					</button>
				</div>

				{/* Popover Body */}
				<div className="flex flex-col gap-3 text-xs">
					{/* Timing */}
					<div className="p-3 bg-muted/40 border border-border rounded-lg flex items-center gap-2.5 text-foreground">
						<Calendar size={15} className="text-muted-foreground shrink-0" />
						<div className="flex flex-col">
							<span className="font-semibold">
								{formatJakartaDisplay(event.startDate, "EEEE, dd MMMM yyyy")}
							</span>
							<span className="text-muted-foreground text-[11px]">
								{formatJakartaDisplay(event.startDate, "HH:mm")} -{" "}
								{formatJakartaDisplay(event.endDate, "HH:mm 'WIB'")}
							</span>
						</div>
					</div>

					{/* Requester or Closure details */}
					{!isClosure ? (
						<div className="flex flex-col gap-2 p-3 bg-muted/40 border border-border rounded-lg">
							<div className="flex items-center gap-2">
								<User size={14} className="text-muted-foreground" />
								<span className="font-semibold text-foreground">
									{event.requesterName}
								</span>
							</div>

							{event.requesterOrganization && (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Building2 size={14} />
									<span className="text-foreground">{event.requesterOrganization}</span>
								</div>
							)}

							{event.attendance && (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Users size={14} />
									<span className="text-foreground">{event.attendance} Orang Peserta</span>
								</div>
							)}

							{event.purpose && (
								<div className="pt-2 border-t border-border flex flex-col gap-0.5">
									<span className="text-[10px] uppercase font-bold text-muted-foreground">
										Keperluan:
									</span>
									<p className="text-foreground text-[11px] leading-relaxed bg-card p-2 rounded border border-border">
										{event.purpose}
									</p>
								</div>
							)}
						</div>
					) : (
						<div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-800 dark:text-rose-300 flex flex-col gap-1.5">
							<div className="flex items-center gap-2 font-bold text-xs">
								<AlertTriangle size={15} className="text-rose-600 dark:text-rose-400" />
								<span>Pemeliharaan / Penutupan Operasional</span>
							</div>
							<p className="text-xs">
								Fasilitas ditutup untuk perbaikan dan kegiatan perawatan teknis
								oleh Pengelola Sarpras.
							</p>
						</div>
					)}
				</div>

				{/* Popover Footer */}
				<div className="flex items-center justify-between pt-2 border-t border-border">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
					>
						Tutup
					</button>

					{!isClosure && (
						<Link
							to="/admin/bookings"
							search={{ search: event.id }}
							onClick={onClose}
							className="px-3 py-1.5 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shadow-xs"
						>
							<span>Buka di Antrean Booking</span>
							<ExternalLink size={13} />
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
