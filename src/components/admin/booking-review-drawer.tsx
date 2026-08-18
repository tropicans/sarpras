import {
	AlertOctagon,
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	ExternalLink,
	FileText,
	Mail,
	MapPin,
	Paperclip,
	Phone,
	User,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	batchApproveBookingsAdminFn,
	getBookingConflictContextFn,
} from "#/lib/booking/admin-fns.functions";
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
	isReadOnly?: boolean;
}

export function BookingReviewDrawer({
	bookingId,
	onClose,
	onApprove,
	onOpenRejectModal,
	isReadOnly = false,
}: BookingReviewDrawerProps) {
	const [data, setData] = useState<{
		target: any;
		hasHardConflict: boolean;
		hasPendingOverlaps: boolean;
		groupSiblings?: Array<any>;
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

	useEffect(() => {
		if (!bookingId) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !actionLoading) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [bookingId, actionLoading, onClose]);

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

	const handleBatchApproveClick = async () => {
		if (!target?.groupId) return;
		try {
			setActionLoading(true);
			await batchApproveBookingsAdminFn({ data: { groupId: target.groupId } });
			onClose();
		} catch (err: any) {
			setError(err.message || "Gagal menyetujui permohonan grup");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="booking-review-drawer-title"
				className="w-full max-w-xl bg-card text-foreground h-full shadow-2xl flex flex-col justify-between border-l border-border overflow-y-auto animate-in slide-in-from-right duration-200"
			>
				{/* Drawer Header */}
				<div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-xs z-10">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<h3
								id="booking-review-drawer-title"
								className="font-bold text-base text-foreground"
							>
								Tinjauan Permohonan
							</h3>
							{target && (
								<span
									className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
										target.status === "approved"
											? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
											: target.status === "rejected"
												? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
												: target.status === "cancelled"
													? "bg-muted text-muted-foreground border-border"
													: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
									}`}
								>
									{target.status}
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
							<span>ID: #{target?.id.slice(0, 8)}</span>
							{target?.groupId && (
								<span className="text-primary font-sans font-semibold">
									&bull; Grup: {target.groupId}
								</span>
							)}
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
						aria-label="Tutup panel peninjauan permohonan"
					>
						<X size={18} aria-hidden="true" />
					</button>
				</div>

				{/* Drawer Body */}
				<div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
					{loading && (
						<div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
							<span>Memeriksa ketersediaan jadwal...</span>
						</div>
					)}

					{error && (
						<div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-start gap-2">
							<AlertOctagon size={16} className="shrink-0 mt-0.5" />
							<span>{error}</span>
						</div>
					)}

					{!loading && target && (
						<>
							{/* Section 1: Conflict Status & Warnings */}
							<div className="flex flex-col gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									1. Analisis Bentrokan Jadwal
								</h4>

								{/* Hard Conflict Warning */}
								{data?.hasHardConflict && (
									<div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col gap-2.5">
										<div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
											<AlertOctagon size={16} className="shrink-0" />
											<span>BENTROKAN JADWAL (HARD CONFLICT)</span>
										</div>
										<p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
											Terdapat permohonan lain yang telah{" "}
											<strong>DISETUJUI</strong> pada rentang waktu yang sama:
										</p>
										<div className="flex flex-col gap-1.5 bg-card p-2.5 rounded-lg border border-rose-500/20">
											{data.approvedConflicts.map((c) => (
												<div
													key={c.id}
													className="text-xs text-foreground flex flex-col"
												>
													<span className="font-semibold">
														{c.requesterName}
													</span>
													<span className="text-[11px] text-muted-foreground">
														{formatJakartaDisplay(
															c.startDate,
															"dd MMM yyyy HH:mm",
														)}{" "}
														- {formatJakartaDisplay(c.endDate, "HH:mm 'WIB'")}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Soft Conflict Warning */}
								{data?.hasPendingOverlaps && (
									<div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-2.5">
										<div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
											<AlertTriangle size={16} className="shrink-0" />
											<span>PERMOHONAN LAIN BERSAMAAN (SOFT CONFLICT)</span>
										</div>
										<p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
											Terdapat permohonan lain berstatus <em>Pending</em> yang
											juga memilih jadwal ini:
										</p>
										<div className="flex flex-col divide-y divide-border bg-card rounded-lg border border-amber-500/20">
											{data.pendingOverlaps.map((p) => (
												<div
													key={p.id}
													className="p-2.5 text-xs text-foreground"
												>
													<div className="font-semibold">{p.requesterName}</div>
													<div className="text-[11px] text-muted-foreground">
														{formatJakartaDisplay(
															p.startDate,
															"dd MMM yyyy HH:mm",
														)}{" "}
														- {formatJakartaDisplay(p.endDate, "HH:mm 'WIB'")}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{!data?.hasHardConflict && !data?.hasPendingOverlaps && (
									<div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs">
										<CheckCircle2
											size={16}
											className="text-emerald-600 dark:text-emerald-400 shrink-0"
										/>
										<span className="font-medium">
											Jadwal Bersih: Tidak ditemukan bentrokan dengan peminjaman
											lain.
										</span>
									</div>
								)}
							</div>

							{/* Section: Sibling Rooms in the same group */}
							{data?.groupSiblings && data.groupSiblings.length > 0 && (
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
											Ruangan Lain Dalam Acara Ini (
											{data.groupSiblings.length + 1} Fasilitas)
										</h4>
										<span className="text-[10px] font-mono text-primary font-semibold">
											MULTI-ROOM GROUP
										</span>
									</div>
									<div className="flex flex-col gap-2">
										{data.groupSiblings.map((sibling: any) => (
											<div
												key={sibling.id}
												className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs"
											>
												<div className="flex flex-col">
													<span className="font-bold text-foreground">
														{sibling.assetName}
													</span>
													<span className="text-[11px] text-muted-foreground">
														{formatJakartaDisplay(
															sibling.startDate,
															"dd MMM yyyy HH:mm",
														)}{" "}
														- {formatJakartaDisplay(sibling.endDate, "HH:mm")}{" "}
														&bull; {sibling.attendance} Pax
													</span>
												</div>
												<span
													className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
														sibling.status === "approved"
															? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
															: sibling.status === "rejected"
																? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
																: sibling.status === "cancelled"
																	? "bg-muted text-muted-foreground border-border"
																	: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
													}`}
												>
													{sibling.status}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Section 2: Pemohon & Instansi */}
							<div className="flex flex-col gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									2. Identitas Pemohon & Tujuan
								</h4>
								<div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col gap-3 text-xs">
									<div className="flex items-center gap-2.5">
										<User size={15} className="text-muted-foreground" />
										<span className="font-bold text-sm text-foreground">
											{target.requesterName}
										</span>
									</div>
									<div className="flex items-center gap-2.5 text-muted-foreground">
										<Mail size={14} />
										<span>{target.requesterEmail}</span>
									</div>
									{target.requesterPhone && (
										<div className="flex items-center gap-2.5 text-muted-foreground">
											<Phone size={14} />
											<span>{target.requesterPhone}</span>
										</div>
									)}
									{target.requesterOrganization && (
										<div className="flex items-center gap-2.5 text-muted-foreground">
											<Building2 size={14} />
											<span className="font-medium text-foreground">
												{target.requesterOrganization}
											</span>
										</div>
									)}
									<div className="pt-2 border-t border-border flex flex-col gap-1">
										<span className="text-[11px] font-semibold text-muted-foreground">
											Tujuan / Keperluan Peminjaman:
										</span>
										<p className="text-xs text-foreground leading-relaxed bg-card p-2.5 rounded border border-border">
											{target.purpose || "Tidak ada rincian tujuan"}
										</p>
									</div>

									{/* Surat Permohonan / Nota Dinas PDF */}
									<div className="pt-2 border-t border-border flex flex-col gap-2">
										<span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase">
											<Paperclip size={13} className="text-primary" />
											Dokumen Surat Permohonan:
										</span>
										{target.letterFileUrl ? (
											<div className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border">
												<div className="flex items-center gap-2 min-w-0">
													<FileText
														size={16}
														className="text-emerald-600 dark:text-emerald-400 shrink-0"
													/>
													<span className="font-semibold text-xs text-foreground truncate max-w-[200px]">
														{target.letterFileName || "Surat_Permohonan.pdf"}
													</span>
												</div>
												<a
													href={target.letterFileUrl}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded"
												>
													<span>Lihat PDF</span>
													<ExternalLink size={12} />
												</a>
											</div>
										) : (
											<p className="text-xs text-muted-foreground italic">
												Tidak ada surat permohonan yang dilampirkan (Data lama).
											</p>
										)}
									</div>
								</div>
							</div>

							{/* Section 3: Jadwal & Fasilitas */}
							<div className="flex flex-col gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									3. Fasilitas & Jadwal Penggunaan
								</h4>
								<div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col gap-3 text-xs">
									<div className="flex items-center justify-between">
										<span className="font-bold text-foreground text-sm">
											{target.assetName}
										</span>
										<span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded">
											{target.assetType === "room" ? "Ruangan" : "Asrama"}
										</span>
									</div>
									{target.assetLocation && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<MapPin size={14} />
											<span>{target.assetLocation}</span>
										</div>
									)}
									{target.roomLayout && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Building2 size={14} className="text-primary" />
											<span>
												Layout Ruangan:{" "}
												<strong className="text-primary font-bold">
													{target.roomLayout}
												</strong>
											</span>
										</div>
									)}
									<div className="flex items-center gap-2 text-muted-foreground">
										<Calendar size={14} />
										<span>
											{formatJakartaDisplay(
												target.startDate,
												"dd MMMM yyyy, HH:mm",
											)}{" "}
											s/d {formatJakartaDisplay(target.endDate, "HH:mm 'WIB'")}
										</span>
									</div>
									{target.attendance && (
										<div className="flex items-center gap-2 text-muted-foreground">
											<Users size={14} />
											<span>
												Kapasitas Diajukan:{" "}
												<strong className="text-foreground">
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
								<div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col gap-1.5 text-xs text-rose-800 dark:text-rose-300">
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
				{target && target.status === "pending" && !isReadOnly && (
					<div className="p-6 border-t border-border bg-card flex flex-wrap items-center justify-end gap-2.5 sticky bottom-0 z-10">
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
							className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
						>
							Tolak Permohonan
						</button>

						{target.groupId &&
							data?.groupSiblings &&
							data.groupSiblings.length > 0 && (
								<button
									type="button"
									onClick={handleBatchApproveClick}
									disabled={actionLoading}
									className="px-3.5 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
								>
									{actionLoading ? "Memproses..." : "Setujui Semua di Grup"}
								</button>
							)}

						<button
							type="button"
							onClick={handleApproveClick}
							disabled={actionLoading}
							className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{actionLoading ? "Memproses..." : "Setujui Ruangan Ini"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
