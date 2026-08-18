import {
	createFileRoute,
	Link,
	useRouter,
} from "@tanstack/react-router";
import {
	AlertCircle,
	AlertTriangle,
	Ban,
	Building,
	Calendar,
	CheckCircle2,
	Clock,
	Loader2,
	Search,
	ShieldAlert,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";
import { getPublicBookingStatusFn } from "#/lib/booking/public-fns.functions";
import { cancelBookingByPublicReferenceFn } from "#/lib/booking/server-fns.functions";
import { ASSET_TYPE_LABELS, type AssetType } from "#/lib/booking/types";

export const Route = createFileRoute("/status/$ref")({
	loader: async ({ params }) => {
		const booking = await getPublicBookingStatusFn({
			data: { ref: params.ref },
		});
		return { booking, ref: params.ref };
	},
	component: BookingStatusDetailPage,
});

function BookingStatusDetailPage() {
	const { booking, ref } = Route.useLoaderData();
	const router = useRouter();

	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [cancelling, setCancelling] = useState(false);
	const [cancelError, setCancelError] = useState<string | null>(null);

	const formatDateTime = (isoString?: string) => {
		if (!isoString) return "-";
		const d = new Date(isoString);
		return d.toLocaleDateString("id-ID", {
			timeZone: "Asia/Jakarta",
			weekday: "short",
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleCancelBooking = async () => {
		if (!booking) return;
		const trimmedReason = cancelReason.trim();
		if (!trimmedReason) {
			setCancelError("Alasan pembatalan wajib diisi.");
			return;
		}

		setCancelling(true);
		setCancelError(null);

		try {
			await cancelBookingByPublicReferenceFn({
				data: {
					bookingId: booking.id,
					referenceToken: ref,
					reason: trimmedReason,
				},
			});

			setCancelModalOpen(false);
			router.invalidate();
		} catch (err: any) {
			setCancelError(
				err.message ||
					"Gagal membatalkan permohonan. Periksa kembali kode referensi Anda.",
			);
		} finally {
			setCancelling(false);
		}
	};

	// Not Found State
	if (!booking) {
		return (
			<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
				<PublicHeader />
				<main className="flex-1 py-16 sm:py-20">
					<div className="mx-auto max-w-md px-4 text-center space-y-4">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
							<AlertCircle className="h-6 w-6" />
						</div>
						<div className="space-y-1">
							<h1 className="text-xl font-bold font-mono text-foreground">
								PERMOHONAN TIDAK DITEMUKAN
							</h1>
							<p className="text-xs text-muted-foreground font-mono">
								ID / Ref: <span className="text-foreground">{ref}</span>
							</p>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Kode referensi tidak sesuai dengan data permohonan peminjaman di sistem. Pastikan UUID lengkap telah dimasukkan dengan benar.
						</p>
						<div className="pt-2 flex items-center justify-center gap-2 font-mono text-xs">
							<Link
								to="/status"
								className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								<Search className="h-3.5 w-3.5" />
								<span>CARI ULANG</span>
							</Link>
							<Link
								to="/"
								className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-1.5 font-medium text-foreground hover:bg-muted transition-colors"
							>
								BERANDA
							</Link>
						</div>
					</div>
				</main>
				<PublicFooter />
			</div>
		);
	}

	const isPending = booking.status === "pending";
	const isApproved = booking.status === "approved";
	const isRejected = booking.status === "rejected";
	const isCancelled = booking.status === "cancelled";

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
			<PublicHeader />

			<main className="flex-1 py-8 sm:py-12">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
					{/* Breadcrumbs */}
					<nav className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
						<Link to="/" className="hover:text-foreground transition-colors">
							ROOT
						</Link>
						<span>/</span>
						<Link to="/status" className="hover:text-foreground transition-colors">
							STATUS
						</Link>
						<span>/</span>
						<span className="text-foreground font-semibold truncate">{booking.id.slice(0, 8)}...</span>
					</nav>

					{/* Top Header Card */}
					<div className="rounded-lg border border-border bg-card p-5 space-y-5">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
									<span>STATUS // TIKET PEMINJAMAN</span>
									<span className="text-border">•</span>
									<span className="text-foreground font-mono font-medium">#{booking.id}</span>
								</div>
								<h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
									{booking.assetName}
								</h1>
							</div>

							{/* Status Badges */}
							<div>
								{isPending && (
									<span className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-800 dark:text-amber-300">
										<Clock className="h-3.5 w-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
										<span>[PENDING // VERIFIKASI]</span>
									</span>
								)}
								{isApproved && (
									<span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-300">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
										<span>[APPROVED // DISETUJUI]</span>
									</span>
								)}
								{isRejected && (
									<span className="inline-flex items-center gap-1.5 rounded border border-destructive/30 bg-destructive/10 px-3 py-1 font-mono text-xs font-semibold text-destructive">
										<XCircle className="h-3.5 w-3.5" />
										<span>[REJECTED // DITOLAK]</span>
									</span>
								)}
								{isCancelled && (
									<span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-3 py-1 font-mono text-xs font-semibold text-muted-foreground">
										<Ban className="h-3.5 w-3.5" />
										<span>[CANCELLED // BATAL]</span>
									</span>
								)}
							</div>
						</div>

						{/* Visual Pipeline Log */}
						<div className="space-y-2">
							<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
								AUDIT LOG ALUR PERSETUJUAN:
							</span>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
								{/* Step 1: Diajukan */}
								<div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-0.5">
									<div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
										<CheckCircle2 className="h-3.5 w-3.5" />
										<span>01. PENGAJUAN</span>
									</div>
									<p className="text-[11px] text-muted-foreground">
										{formatDateTime(booking.createdAt)} WIB
									</p>
								</div>

								{/* Step 2: Verifikasi */}
								<div
									className={`rounded border p-3 space-y-0.5 ${
										isPending
											? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-300"
											: "border-border bg-muted/20 text-muted-foreground"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-bold">
										<Clock className="h-3.5 w-3.5" />
										<span>02. VERIFIKASI OPERATOR</span>
									</div>
									<p className="text-[11px] text-muted-foreground">
										{isPending
											? "Sedang diverifikasi petugas"
											: isApproved || isRejected || isCancelled
												? "Pemeriksaan selesai"
												: "Antrean verifikasi"}
									</p>
								</div>

								{/* Step 3: Keputusan */}
								<div
									className={`rounded border p-3 space-y-0.5 ${
										isApproved
											? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
											: isRejected
												? "border-destructive/30 bg-destructive/5 text-destructive"
												: isCancelled
													? "border-border bg-muted text-muted-foreground"
													: "border-border bg-muted/20 text-muted-foreground"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-bold">
										{isApproved && <CheckCircle2 className="h-3.5 w-3.5" />}
										{isRejected && <XCircle className="h-3.5 w-3.5" />}
										{isCancelled && <Ban className="h-3.5 w-3.5" />}
										{isPending && <Clock className="h-3.5 w-3.5" />}
										<span>03. KEPUTUSAN FINAL</span>
									</div>
									<p className="text-[11px] text-muted-foreground">
										{isApproved
											? "Izin Penggunaan Terbit"
											: isRejected
												? "Permohonan Ditolak"
												: isCancelled
													? "Dibatalkan Pemohon"
													: "Menunggu Hasil"}
									</p>
								</div>
							</div>
						</div>

						{/* Rejection Alert */}
						{isRejected && booking.rejectionReason && (
							<div className="rounded border border-destructive/30 bg-destructive/5 p-4 space-y-1.5 font-mono">
								<div className="flex items-center gap-2 text-destructive font-bold text-xs">
									<AlertCircle className="h-4 w-4 shrink-0" />
									<span>CATATAN PENOLAKAN VERIFIKATOR:</span>
								</div>
								<p className="text-xs text-destructive/90 bg-background rounded p-2.5 border border-destructive/20">
									"{booking.rejectionReason}"
								</p>
							</div>
						)}

						{/* Multi-Room Group Section if applicable */}
						{booking.items && booking.items.length > 1 && (
							<div className="space-y-3 pt-3 border-t border-border font-mono text-xs">
								<div className="flex items-center justify-between">
									<span className="text-[11px] uppercase font-bold text-foreground flex items-center gap-1.5">
										<Building className="h-3.5 w-3.5 text-primary" />
										RINCIAN SELURUH FASILITAS DALAM GRUP ({booking.items.length} RUANGAN)
									</span>
									<span className="text-[10px] text-muted-foreground">
										Group Ref: {booking.groupId}
									</span>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{booking.items.map((item: any) => {
										const itemPending = item.status === "pending";
										const itemApproved = item.status === "approved";
										const itemRejected = item.status === "rejected";
										const itemCancelled = item.status === "cancelled";

										return (
											<div
												key={item.id}
												className="rounded border border-border bg-muted/20 p-3.5 space-y-2"
											>
												<div className="flex items-center justify-between border-b border-border/40 pb-1.5">
													<div className="font-bold text-foreground flex items-center gap-1.5">
														<DoorOpen className="h-3.5 w-3.5 text-primary" />
														<span>{item.assetName}</span>
													</div>
													<div>
														{itemPending && (
															<span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
																PENDING
															</span>
														)}
														{itemApproved && (
															<span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
																APPROVED
															</span>
														)}
														{itemRejected && (
															<span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded font-semibold">
																REJECTED
															</span>
														)}
														{itemCancelled && (
															<span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded font-semibold">
																CANCELLED
															</span>
														)}
													</div>
												</div>

												<div className="space-y-1 text-[11px]">
													<div className="flex justify-between text-muted-foreground">
														<span>Jadwal:</span>
														<span className="text-foreground">
															{formatDateTime(item.startDate)} s.d.{" "}
															{formatDateTime(item.endDate)}
														</span>
													</div>
													<div className="flex justify-between text-muted-foreground">
														<span>Peserta:</span>
														<span className="font-bold text-foreground">
															{item.attendance} Pax (Kapasitas: {item.capacity})
														</span>
													</div>
													{item.rejectionReason && (
														<div className="text-destructive text-[10px] pt-1">
															Alasan penolakan: "{item.rejectionReason}"
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Asset & Schedule Spec Sheet (Single or Primary Room) */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-xs">
							<div className="rounded border border-border bg-muted/30 p-4 space-y-2">
								<span className="text-[10px] uppercase text-primary font-bold flex items-center gap-1.5">
									<Building className="h-3.5 w-3.5" />
									SPESIFIKASI SARANA
								</span>
								<div className="space-y-1.5 pt-1">
									<div className="flex justify-between border-b border-border/40 pb-1">
										<span className="text-muted-foreground">Sarana</span>
										<span className="font-semibold text-foreground">{booking.assetName}</span>
									</div>
									<div className="flex justify-between border-b border-border/40 pb-1">
										<span className="text-muted-foreground">Kategori</span>
										<span className="font-semibold text-foreground">
											{ASSET_TYPE_LABELS[booking.assetType as AssetType] || booking.assetType}
										</span>
									</div>
									<div className="flex justify-between border-b border-border/40 pb-1">
										<span className="text-muted-foreground">Lokasi</span>
										<span className="font-semibold text-foreground">
											{booking.assetLocation || "Gedung Utama PPKASN"}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Jumlah Peserta</span>
										<span className="font-bold text-primary">{booking.attendance} Pax</span>
									</div>
								</div>
							</div>

							<div className="rounded border border-border bg-muted/30 p-4 space-y-2">
								<span className="text-[10px] uppercase text-primary font-bold flex items-center gap-1.5">
									<Calendar className="h-3.5 w-3.5" />
									PERIODE WAKTU (WIB)
								</span>
								<div className="space-y-1.5 pt-1">
									<div className="flex justify-between border-b border-border/40 pb-1">
										<span className="text-muted-foreground">Mulai</span>
										<span className="font-semibold text-foreground">{formatDateTime(booking.startDate)} WIB</span>
									</div>
									<div className="flex justify-between border-b border-border/40 pb-1">
										<span className="text-muted-foreground">Selesai</span>
										<span className="font-semibold text-foreground">{formatDateTime(booking.endDate)} WIB</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Update Terakhir</span>
										<span className="text-muted-foreground">{formatDateTime(booking.updatedAt)} WIB</span>
									</div>
								</div>
							</div>
						</div>

						{/* Self-Service Cancellation Option */}
						{(isPending || isApproved) && (
							<div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
								<div className="text-muted-foreground flex items-center gap-1.5">
									<ShieldAlert className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
									<span>Perlu membatalkan jadwal ini sebelum waktu pelaksanaan?</span>
								</div>
								<button
									type="button"
									onClick={() => setCancelModalOpen(true)}
									className="inline-flex items-center gap-1.5 rounded border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer shrink-0"
								>
									<Ban className="h-3.5 w-3.5" />
									<span>[BATALKAN PERMOHONAN]</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</main>

			{/* Cancellation Confirmation Modal */}
			{cancelModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
					<div
						className="relative w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-2xl space-y-4 font-mono text-xs"
						role="dialog"
						aria-modal="true"
					>
						<div className="flex items-center gap-2.5 text-destructive border-b border-border pb-3">
							<div className="flex h-7 w-7 items-center justify-center rounded border border-destructive/30 bg-destructive/10">
								<AlertTriangle className="h-4 w-4" />
							</div>
							<div>
								<h3 className="font-bold text-sm text-foreground">
									KONFIRMASI PEMBATALAN
								</h3>
								<p className="text-[11px] text-muted-foreground">
									Tindakan ini permanen dan tidak dapat diurungkan.
								</p>
							</div>
						</div>

						{cancelError && (
							<div className="rounded bg-destructive/10 border border-destructive/20 p-2.5 text-destructive text-[11px]">
								{cancelError}
							</div>
						)}

						<p className="text-foreground/90 leading-relaxed font-sans text-xs">
							Apakah Anda yakin ingin membatalkan permohonan peminjaman untuk{" "}
							<strong>{booking.assetName}</strong> pada tanggal{" "}
							{formatDateTime(booking.startDate)} WIB?
						</p>

						<div className="space-y-1">
							<label className="text-[11px] font-semibold text-foreground block uppercase">
								Alasan Pembatalan <span className="text-destructive">*</span>:
							</label>
							<textarea
								rows={3}
								value={cancelReason}
								onChange={(e) => {
									setCancelReason(e.target.value);
									if (cancelError) setCancelError(null);
								}}
								placeholder="Tuliskan alasan pembatalan peminjaman..."
								className="w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden resize-none font-sans"
							/>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
							<button
								type="button"
								disabled={cancelling}
								onClick={() => setCancelModalOpen(false)}
								className="rounded border border-border bg-background px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
							>
								KEMBALI
							</button>
							<button
								type="button"
								disabled={cancelling}
								onClick={handleCancelBooking}
								className="inline-flex items-center gap-1.5 rounded bg-destructive px-3 py-1.5 font-bold text-destructive-foreground hover:bg-destructive/90 transition-all disabled:opacity-50 cursor-pointer"
							>
								{cancelling ? (
									<>
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
										MEMPROSES...
									</>
								) : (
									"YA, BATALKAN"
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			<PublicFooter />
		</div>
	);
}
