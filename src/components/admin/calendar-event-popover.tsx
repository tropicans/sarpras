import { Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	Building2,
	Calendar,
	CalendarCheck2,
	Clock,
	ExternalLink,
	Mail,
	MapPin,
	Phone,
	User,
	Users,
	X,
} from "lucide-react";
import React from "react";
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
			<div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#e4e4e7] flex flex-col gap-4">
				{/* Popover Header */}
				<div className="flex items-start justify-between pb-3 border-b border-[#e4e4e7]">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-sm text-[#09090b]">
								{isClosure ? "Jadwal Penutupan Fasilitas" : "Detail Peminjaman"}
							</h3>
							<span
								className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
									event.status === "approved"
										? "bg-emerald-100 text-emerald-800"
										: event.status === "closed"
											? "bg-rose-100 text-rose-800"
											: "bg-amber-100 text-amber-800"
								}`}
							>
								{event.status === "approved"
									? "Disetujui"
									: event.status === "closed"
										? "Ditutup"
										: "Pending"}
							</span>
						</div>
						<span className="text-xs text-[#71717a]">{event.assetName}</span>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-md transition-colors cursor-pointer"
					>
						<X size={18} />
					</button>
				</div>

				{/* Popover Body */}
				<div className="flex flex-col gap-3 text-xs">
					{/* Timing */}
					<div className="p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-lg flex items-center gap-2.5 text-[#09090b]">
						<Calendar size={15} className="text-[#71717a] shrink-0" />
						<div className="flex flex-col">
							<span className="font-semibold">
								{formatJakartaDisplay(event.startDate, "EEEE, dd MMMM yyyy")}
							</span>
							<span className="text-[#71717a] text-[11px]">
								{formatJakartaDisplay(event.startDate, "HH:mm")} -{" "}
								{formatJakartaDisplay(event.endDate, "HH:mm 'WIB'")}
							</span>
						</div>
					</div>

					{/* Requester or Closure details */}
					{!isClosure ? (
						<div className="flex flex-col gap-2 p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
							<div className="flex items-center gap-2">
								<User size={14} className="text-[#71717a]" />
								<span className="font-semibold text-[#09090b]">
									{event.requesterName}
								</span>
							</div>

							{event.requesterOrganization && (
								<div className="flex items-center gap-2 text-[#71717a]">
									<Building2 size={14} />
									<span>{event.requesterOrganization}</span>
								</div>
							)}

							{event.attendance && (
								<div className="flex items-center gap-2 text-[#71717a]">
									<Users size={14} />
									<span>{event.attendance} Orang Peserta</span>
								</div>
							)}

							{event.purpose && (
								<div className="pt-2 border-t border-[#e4e4e7] flex flex-col gap-0.5">
									<span className="text-[10px] uppercase font-bold text-[#71717a]">
										Keperluan:
									</span>
									<p className="text-[#09090b] text-[11px] leading-relaxed">
										{event.purpose}
									</p>
								</div>
							)}
						</div>
					) : (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex flex-col gap-1.5">
							<div className="flex items-center gap-2 font-bold text-xs">
								<AlertTriangle size={15} className="text-rose-600" />
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
				<div className="flex items-center justify-between pt-2 border-t border-[#e4e4e7]">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 text-xs text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-md transition-colors cursor-pointer"
					>
						Tutup
					</button>

					{!isClosure && (
						<Link
							to="/admin/bookings"
							search={{ search: event.id }}
							onClick={onClose}
							className="px-3 py-1.5 bg-[#09090b] hover:bg-[#27272a] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
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
