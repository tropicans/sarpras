import { Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	Users,
} from "lucide-react";
import React from "react";
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

export function UrgentBookingsWidget({
	items,
	onReview,
}: UrgentBookingsWidgetProps) {
	if (!items || items.length === 0) {
		return (
			<div className="p-6 bg-white border border-[#e4e4e7] rounded-xl shadow-xs flex flex-col items-center justify-center text-center gap-3 py-10">
				<div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
					<CheckCircle2 size={28} />
				</div>
				<div className="flex flex-col gap-0.5">
					<h4 className="font-semibold text-sm text-[#09090b]">
						Semua Permohonan Telah Diproses
					</h4>
					<p className="text-xs text-[#71717a] max-w-sm">
						Tidak ada permohonan peminjaman yang menunggu persetujuan saat ini.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 bg-white border border-[#e4e4e7] rounded-xl shadow-xs flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-amber-100 text-amber-800 rounded-md">
						<Clock size={18} />
					</div>
					<div>
						<h3 className="font-semibold text-sm text-[#09090b]">
							Antrean Permohonan Mendesak
						</h3>
						<p className="text-xs text-[#71717a]">
							{items.length} permohonan menunggu tindakan persetujuan
						</p>
					</div>
				</div>

				<Link
					to="/admin/bookings"
					search={{ status: "pending" }}
					className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
				>
					<span>Lihat Semua</span>
					<ArrowRight size={14} />
				</Link>
			</div>

			<div className="divide-y divide-[#e4e4e7] border border-[#e4e4e7] rounded-lg overflow-hidden">
				{items.map((item) => (
					<div
						key={item.id}
						className="p-4 hover:bg-[#fafafa] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
					>
						<div className="flex flex-col gap-1.5 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="font-semibold text-sm text-[#09090b] truncate">
									{item.requesterName}
								</span>
								{item.requesterOrganization && (
									<span className="text-xs text-[#71717a] px-2 py-0.5 bg-[#f4f4f5] rounded">
										{item.requesterOrganization}
									</span>
								)}
								<span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
									Pending
								</span>
							</div>

							<div className="flex items-center gap-4 text-xs text-[#71717a] flex-wrap">
								<span className="font-medium text-[#09090b]">
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
								className="px-3 py-1.5 bg-[#09090b] hover:bg-[#27272a] text-white text-xs font-medium rounded-md transition-colors shadow-xs"
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
