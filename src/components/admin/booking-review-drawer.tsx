import {
	AlertOctagon,
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Mail,
	MapPin,
	Phone,
	User,
	Users,
	X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { getBookingConflictContextFn } from "#/lib/booking/admin-fns.server";
import { formatJakartaDisplay } from "#/lib/timezone/datetime";

interface BookingReviewDrawerProps {
	bookingId: string | null;
	onClose: () => void;
	onApprove: (bookingId: string) => Promise<void>;
	onOpenRejectModal: (booking: {
		id: string;
		requesterName: string;
		assetName: string;
	}) => void;
}

export function BookingReviewDrawer({
	bookingId,
	onClose,
	onApprove,
	onOpenRejectModal,
}: BookingReviewDrawerProps) {
	const [data, setData] = useState<{
		target: any;
		hasHardConflict: boolean;
		hasPendingOverlaps: boolean;
		approvedConflicts: Array<any>;
		pendingOverlaps: Array<any>;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!bookingId) {
			setData(null);
			return;
		}

		setLoading(true);
		setError(null);
		getBookingConflictContextFn({ data: { bookingId } })
			.then(setData)
			.catch((err) =>
				setError(err.message || "Gagal memuat konteks konflik permohonan"),
			)
			.finally(() => setLoading(false));
	}, [bookingId]);

	if (!bookingId) return null;

	const target = data?.target;

	const handleApproveClick = async () => {
		if (!target) return;
		if (data?.hasHardConflict) {
			const confirm = window.confirm(
				"PERINGATAN: Terdapat jadwal yang bertabrakan dengan peminjaman yang telah disetujui sebelumnya. Apakah Anda yakin tetap ingin memproses persetujuan?",
			);
			if (!confirm) return;
		}

		try {
			setActionLoading(true);
			await onApprove(target.id);
			onClose();
		} catch (err: any) {
			setError(err.message || "Gagal menyetujui permohonan");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
			<div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#e4e4e7] overflow-y-auto animate-in slide-in-from-right duration-200">
				{/* Drawer Header */}
				<div className="p-6 border-b border-[#e4e4e7] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-base text-[#09090b]">
								Tinjauan Permohonan
							</h3>
							{target && (
								<span
									className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
										target.status === "approved"
											? "bg-emerald-100 text-emerald-800"
											: target.status === "rejected"
												? "bg-rose-100 text-rose-800"
												: target.status === "cancelled"
													? "bg-zinc-100 text-zinc-800"
													: "bg-amber-100 text-amber-800"
									}`}
								>
									{target.status}
								</span>
							)}
						</div>
						<span className="text-xs text-[#71717a] font-mono truncate max-w-xs">
							Ref ID: {bookingId}
						</span>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="p-2 text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-lg transition-colors cursor-pointer"
					>
						<X size={20} />
					</button>
				</div>

				{/* Drawer Body */}
				<div className="p-6 flex-1 flex flex-col gap-6">
					{loading && (
						<div className="flex h-64 items-center justify-center">
							<div className="text-xs font-medium text-[#71717a] animate-pulse">
								Memeriksa integritas jadwal dan konflik...
							</div>
						</div>
					)}

					{error && (
						<div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
							<AlertOctagon size={16} className="shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{target && !loading && (
						<>
							{/* Section 1: Live Conflict Inspector */}
							<div className="flex flex-col gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-[#71717a]">
									1. Analisis Konflik Jadwal (Live Inspector)
								</h4>

								{data?.hasHardConflict && (
									<div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2.5 text-rose-900">
										<div className="flex items-center gap-2 font-bold text-xs">
											<AlertOctagon size={16} className="text-rose-600" />
											<span>
												Konflik Keras: Bertabrakan dengan Booking Disetujui!
											</span>
										</div>
										<p className="text-xs leading-relaxed">
											Fasilitas ini telah disetujui untuk kegiatan lain pada
											rentang waktu yang sama:
										</p>
										<div className="divide-y divide-rose-200 border border-rose-200 rounded-lg bg-white/80 overflow-hidden">
											{data.approvedConflicts.map((c) => (
												<div key={c.id} className="p-2.5 text-xs text-rose-950">
													<div className="font-semibold">{c.requesterName}</div>
													<div className="text-[11px] text-rose-800">
														{formatJakartaDisplay(
															c.startDate,
															"dd MMM yyyy HH:mm",
														)}{" "}
														-{" "}
														{formatJakartaDisplay(c.endDate, "HH:mm WIB")}
													</div>
													{c.purpose && (
														<div className="text-[11px] text-rose-700 italic">
															"{c.purpose}"
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{!data?.hasHardConflict && data?.hasPendingOverlaps && (
									<div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2.5 text-amber-900">
										<div className="flex items-center gap-2 font-bold text-xs">
											<AlertTriangle size={16} className="text-amber-600" />
											<span>
												Kompetisi Jadwal: Ada Permohonan Pending Lain
											</span>
										</div>
										<p className="text-xs">
											Terdapat {data.pendingOverlaps.length} permohonan lain yang
											juga bersaing meminjam slot waktu ini:
										</p>
										<div className="divide-y divide-amber-200 border border-amber-200 rounded-lg bg-white/80 overflow-hidden">
											{data.pendingOverlaps.map((p) => (
												<div key={p.id} className="p-2.5 text-xs text-amber-950">
													<div className="font-semibold">{p.requesterName}</div>
													<div className="text-[11px] text-amber-800">
														{formatJakartaDisplay(
															p.startDate,
															"dd MMM yyyy HH:mm",
														)}{" "}
														-{" "}
														{formatJakartaDisplay(p.endDate, "HH:mm WIB")}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{!data?.hasHardConflict && !data?.hasPendingOverlaps && (
									<div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs">
										<CheckCircle2
											size={16}
											className="text-emerald-600 shrink-0"
										/>
										<span className="font-medium">
											Jadwal Bersih: Tidak ditemukan bentrokan dengan peminjaman
											lain.
										</span>
									</div>
								)}
							</div>

							{/* Section 2: Pemohon & Instansi */}
							<div className="flex flex-col gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-[#71717a]">
									2. Identitas Pemohon & Tujuan
								</h4>
								<div className="p-4 bg-[#fafafa] border border-[#e4e4e7] rounded-xl flex flex-col gap-3 text-xs">
									<div className="flex items-center gap-2.5">
										<User size={15} className="text-[#71717a]" />
										<span className="font-bold text-sm text-[#09090b]">
											{target.requesterName}
										</span>
									</div>
									<div className="flex items-center gap-2.5 text-[#71717a]">
										<Mail size={14} />
										<span>{target.requesterEmail}</span>
									</div>
									{target.requesterPhone && (
										<div className="flex items-center gap-2.5 text-[#71717a]">
											<Phone size={14} />
											<span>{target.requesterPhone}</span>
										</div>
									)}
									{target.requesterOrganization && (
										<div className="flex items-center gap-2.5 text-[#71717a]">
											<Building2 size={14} />
											<span className="font-medium text-[#09090b]">
												{target.requesterOrganization}
											</span>
										</div>
									)}
									<div className="pt-2 border-t border-[#e4e4e7] flex flex-col gap-1">
										<span className="text-[11px] font-semibold text-[#71717a]">
											Tujuan / Keperluan Peminjaman:
										</span>
										<p className="text-xs text-[#09090b] leading-relaxed bg-white p-2.5 rounded border border-[#e4e4e7]">
											{target.purpose || "Tidak ada rincian tujuan"}
										</p>
									</div>
								</div>
							</div>

							{/* Section 3: Jadwal & Fasilitas */}
							<div className="flex flex-col gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-[#71717a]">
									3. Fasilitas & Jadwal Penggunaan
								</h4>
								<div className="p-4 bg-[#fafafa] border border-[#e4e4e7] rounded-xl flex flex-col gap-3 text-xs">
									<div className="flex items-center justify-between">
										<span className="font-bold text-[#09090b] text-sm">
											{target.assetName}
										</span>
										<span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-[#e4e4e7] rounded">
											{target.assetType === "room" ? "Ruangan" : "Asrama"}
										</span>
									</div>
									{target.assetLocation && (
										<div className="flex items-center gap-2 text-[#71717a]">
											<MapPin size={14} />
											<span>{target.assetLocation}</span>
										</div>
									)}
									<div className="flex items-center gap-2 text-[#71717a]">
										<Calendar size={14} />
										<span>
											{formatJakartaDisplay(
												target.startDate,
												"dd MMMM yyyy, HH:mm",
											)}{" "}
											s/d {formatJakartaDisplay(target.endDate, "HH:mm WIB")}
										</span>
									</div>
									{target.attendance && (
										<div className="flex items-center gap-2 text-[#71717a]">
											<Users size={14} />
											<span>
												Kapasitas Diajukan:{" "}
												<strong className="text-[#09090b]">
													{target.attendance} orang
												</strong>{" "}
												(Maks. {target.assetCapacity} orang)
											</span>
										</div>
									)}
								</div>
							</div>

							{/* Rejection Note (if rejected) */}
							{target.status === "rejected" && target.rejectionReason && (
								<div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-1.5 text-xs text-rose-900">
									<span className="font-bold">Alasan Penolakan:</span>
									<p className="leading-relaxed italic">
										"{target.rejectionReason}"
									</p>
								</div>
							)}
						</>
					)}
				</div>

				{/* Action Footer */}
				{target && target.status === "pending" && (
					<div className="p-6 border-t border-[#e4e4e7] bg-[#fafafa] flex items-center justify-end gap-3 sticky bottom-0 z-10">
						<button
							type="button"
							onClick={() =>
								onOpenRejectModal({
									id: target.id,
									requesterName: target.requesterName,
									assetName: target.assetName,
								})
							}
							disabled={actionLoading}
							className="px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
						>
							Tolak Permohonan
						</button>

						<button
							type="button"
							onClick={handleApproveClick}
							disabled={actionLoading}
							className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{actionLoading ? "Memproses..." : "Setujui Permohonan"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
