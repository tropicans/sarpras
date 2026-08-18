import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { formatJakartaDisplay } from "#/lib/timezone/datetime";

interface UrgentBookingItem {
	id: string;
	assetId: string;
	assetName: string;
	assetType: string;
	requesterName: string;
	requesterEmail: string;
	requesterOrganization: string | null;
	purpose: string | null;
	attendance: number | null;
	startDate: string;
	endDate: string;
	status: string;
	createdAt: string;
}

interface UrgentBookingsWidgetProps {
	items: UrgentBookingItem[];
	onReview?: (bookingId: string) => void;
}

export function UrgentBookingsWidget({ items }: UrgentBookingsWidgetProps) {
	if (!items || items.length === 0) {
		return (
			<div className="p-6 bg-card border border-border rounded-xl shadow-xs flex flex-col items-center justify-center text-center gap-3 py-10">
				<div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
					<CheckCircle2 size={28} />
				</div>
				<div className="flex flex-col gap-0.5">
					<h4 className="font-semibold text-sm text-foreground">
						Semua Permohonan Telah Diproses
					</h4>
					<p className="text-xs text-muted-foreground max-w-sm">
						Tidak ada permohonan peminjaman yang menunggu persetujuan saat ini.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 bg-card border border-border rounded-xl shadow-xs flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-md border border-amber-500/20">
						<Clock size={18} />
					</div>
					<div>
						<h3 className="font-semibold text-sm text-foreground">
							Antrean Permohonan Mendesak
						</h3>
						<p className="text-xs text-muted-foreground">
							{items.length} permohonan menunggu tindakan persetujuan
						</p>
					</div>
				</div>

				<Link
					to="/admin/bookings"
					search={{ status: "pending" }}
					className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
				>
					<span>Lihat Semua</span>
					<ArrowRight size={14} />
				</Link>
			</div>

			<div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
				{items.map((item) => (
					<div
						key={item.id}
						className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
					>
						<div className="flex flex-col gap-1.5 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="font-semibold text-sm text-foreground truncate">
									{item.requesterName}
								</span>
								{item.requesterOrganization && (
									<span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded border border-border/50">
										{item.requesterOrganization}
									</span>
								)}
								<span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded">
									Pending
								</span>
							</div>

							<div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
								<span className="font-medium text-foreground">
									{item.assetName}
								</span>
								<span>•</span>
								<span className="flex items-center gap-1">
									<Calendar size={13} />
									{formatJakartaDisplay(item.startDate, "dd MMM yyyy, HH:mm")} -{" "}
									{formatJakartaDisplay(item.endDate, "HH:mm 'WIB'")}
								</span>
								{item.attendance && (
									<>
										<span>•</span>
										<span className="flex items-center gap-1">
											<Users size={13} />
											{item.attendance} orang
										</span>
									</>
								)}
							</div>
						</div>

						<div className="flex items-center gap-2 self-start md:self-center shrink-0">
							<Link
								to="/admin/bookings"
								search={{ search: item.id }}
								className="px-3 py-1.5 bg-primary hover:opacity-90 text-primary-foreground text-xs font-medium rounded-md transition-all shadow-xs cursor-pointer"
							>
								Tinjau Permohonan
							</Link>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
