import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import {
	AlertCircle,
	AlertTriangle,
	Ban,
	BedDouble,
	Building,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Clock,
	DoorOpen,
	FileText,
	HelpCircle,
	Loader2,
	MapPin,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	User,
	Users,
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
	const navigate = useNavigate();

	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [cancelling, setCancelling] = useState(false);
	const [cancelError, setCancelError] = useState<string | null>(null);

	const isRoom = booking?.assetType === "room";

	const formatDateTime = (isoString?: string) => {
		if (!isoString) return "-";
		const d = new Date(isoString);
		return d.toLocaleDateString("id-ID", {
			timeZone: "Asia/Jakarta",
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleCancelBooking = async () => {
		if (!booking) return;
		setCancelling(true);
		setCancelError(null);

		try {
			await cancelBookingByPublicReferenceFn({
				data: {
					bookingId: booking.id,
					referenceToken: ref,
					reason: cancelReason.trim() || undefined,
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
				<main className="flex-1 py-16 sm:py-24">
					<div className="mx-auto max-w-xl px-4 text-center space-y-6">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
							<AlertCircle className="h-8 w-8" />
						</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-bold text-foreground">
								Permohonan Tidak Ditemukan
							</h1>
							<p className="text-sm text-muted-foreground">
								Kode referensi <strong>"{ref}"</strong> tidak sesuai dengan data
								permohonan peminjaman manapun di sistem.
							</p>
						</div>
						<div className="pt-4 flex items-center justify-center gap-3">
							<Link
								to="/status"
								className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
							>
								<Search className="h-4 w-4" />
								Cari Ulang Kode Referensi
							</Link>
							<Link
								to="/"
								className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
							>
								Beranda
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
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
					{/* Breadcrumbs */}
					<nav className="flex items-center gap-2 text-xs text-muted-foreground">
						<Link to="/" className="hover:text-foreground transition-colors">
							Beranda
						</Link>
						<ChevronRight className="h-3.5 w-3.5" />
						<Link
							to="/status"
							className="hover:text-foreground transition-colors"
						>
							Cek Status
						</Link>
						<ChevronRight className="h-3.5 w-3.5" />
						<span className="text-foreground font-medium truncate">
							{booking.id}
						</span>
					</nav>

					{/* Top Header Card */}
					<div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Status Permohonan Peminjaman
								</p>
								<h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
									{booking.assetName}
								</h1>
								<p className="text-xs text-muted-foreground font-mono">
									ID: {booking.id}
								</p>
							</div>

							{/* Status Badges */}
							<div>
								{isPending && (
									<span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-300">
										<Clock className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400" />
										Menunggu Verifikasi
									</span>
								)}
								{isApproved && (
									<span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
										<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
										Disetujui Petugas
									</span>
								)}
								{isRejected && (
									<span className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs font-bold text-destructive">
										<XCircle className="h-4 w-4" />
										Permohonan Ditolak
									</span>
								)}
								{isCancelled && (
									<span className="inline-flex items-center gap-2 rounded-xl bg-muted border border-border px-4 py-2 text-xs font-bold text-muted-foreground">
										<Ban className="h-4 w-4" />
										Permohonan Dibatalkan
									</span>
								)}
							</div>
						</div>

						{/* Visual Status Progress Timeline */}
						<div className="py-2 space-y-3">
							<p className="text-xs font-semibold text-muted-foreground">
								Progres Alur Persetujuan:
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{/* Step 1: Diajukan */}
								<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1">
									<div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
										<CheckCircle2 className="h-4 w-4" />
										1. Permohonan Diajukan
									</div>
									<p className="text-[11px] text-muted-foreground">
										{formatDateTime(booking.createdAt)} WIB
									</p>
								</div>

								{/* Step 2: Verifikasi */}
								<div
									className={`rounded-xl border p-3.5 space-y-1 ${
										isPending
											? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-300"
											: "border-border bg-card text-muted-foreground"
									}`}
								>
									<div className="flex items-center gap-2 text-xs font-bold">
										<Clock className="h-4 w-4" />
										2. Verifikasi Operator
									</div>
									<p className="text-[11px] text-muted-foreground">
										{isPending
											? "Sedang diperiksa petugas"
											: isApproved || isRejected || isCancelled
												? "Pemeriksaan selesai"
												: "Antrean verifikasi"}
									</p>
								</div>

								{/* Step 3: Keputusan Final */}
								<div
									className={`rounded-xl border p-3.5 space-y-1 ${
										isApproved
											? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
											: isRejected
												? "border-destructive/30 bg-destructive/5 text-destructive"
												: isCancelled
													? "border-border bg-muted/40 text-muted-foreground"
													: "border-border bg-card text-muted-foreground"
									}`}
								>
									<div className="flex items-center gap-2 text-xs font-bold">
										{isApproved && <CheckCircle2 className="h-4 w-4" />}
										{isRejected && <XCircle className="h-4 w-4" />}
										{isCancelled && <Ban className="h-4 w-4" />}
										{isPending && <Clock className="h-4 w-4" />}
										3. Keputusan Layanan
									</div>
									<p className="text-[11px] text-muted-foreground">
										{isApproved
											? "Izin Penggunaan Terbit"
											: isRejected
												? "Permohonan Ditolak"
												: isCancelled
													? "Peminjaman Dibatalkan"
													: "Menunggu Keputusan"}
									</p>
								</div>
							</div>
						</div>

						{/* Rejection Alert Box */}
						{isRejected && booking.rejectionReason && (
							<div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-2">
								<div className="flex items-center gap-2 text-destructive font-bold text-sm">
									<AlertCircle className="h-5 w-5 shrink-0" />
									<span>Alasan Penolakan dari Petugas Verifikator:</span>
								</div>
								<p className="text-sm text-destructive/90 bg-background/80 rounded-xl p-3.5 border border-destructive/20 font-medium">
									"{booking.rejectionReason}"
								</p>
							</div>
						)}

						{/* Asset & Schedule Details Card */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
							<div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
								<h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
									<Building className="h-3.5 w-3.5" />
									Informasi Sarana
								</h3>
								<div className="space-y-2 text-xs">
									<div>
										<span className="text-muted-foreground">Sarana:</span>
										<p className="font-semibold text-foreground text-sm">
											{booking.assetName}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											Kategori & Lokasi:
										</span>
										<p className="font-medium text-foreground">
											{ASSET_TYPE_LABELS[booking.assetType as AssetType] ||
												booking.assetType}{" "}
											&bull; {booking.assetLocation || "Gedung Utama PPKASN"}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											Peserta / Tamu:
										</span>
										<p className="font-semibold text-primary">
											{booking.attendance} Orang (Kapasitas Maksimal:{" "}
											{booking.capacity})
										</p>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
								<h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
									<Calendar className="h-3.5 w-3.5" />
									Jadwal Penggunaan (WIB)
								</h3>
								<div className="space-y-2 text-xs">
									<div>
										<span className="text-muted-foreground">Waktu Mulai:</span>
										<p className="font-semibold text-foreground">
											{formatDateTime(booking.startDate)} WIB
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											Waktu Selesai:
										</span>
										<p className="font-semibold text-foreground">
											{formatDateTime(booking.endDate)} WIB
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">
											Terakhir Diperbarui:
										</span>
										<p className="font-medium text-muted-foreground">
											{formatDateTime(booking.updatedAt)} WIB
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Self-Service Cancellation Option (D-07) */}
						{(isPending || isApproved) && (
							<div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
								<div className="text-xs text-muted-foreground flex items-center gap-2">
									<ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
									<span>
										Perlu membatalkan kegiatan? Anda dapat melakukan pembatalan
										mandiri sebelum jadwal pelaksanaan.
									</span>
								</div>
								<button
									type="button"
									onClick={() => setCancelModalOpen(true)}
									className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors cursor-pointer shrink-0"
								>
									<Ban className="h-4 w-4" />
									Batalkan Permohonan Ini
								</button>
							</div>
						)}
					</div>
				</div>
			</main>

			{/* Cancellation Confirmation Modal */}
			{cancelModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
					<div
						className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5"
						role="dialog"
						aria-modal="true"
					>
						<div className="flex items-center gap-3 text-destructive">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
								<AlertTriangle className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-bold text-base text-foreground">
									Konfirmasi Pembatalan
								</h3>
								<p className="text-xs text-muted-foreground">
									Tindakan ini tidak dapat diurungkan.
								</p>
							</div>
						</div>

						{cancelError && (
							<div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
								{cancelError}
							</div>
						)}

						<p className="text-xs text-foreground/90 leading-relaxed">
							Apakah Anda yakin ingin membatalkan permohonan peminjaman untuk{" "}
							<strong>{booking.assetName}</strong> pada jadwal{" "}
							{formatDateTime(booking.startDate)} WIB?
						</p>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground">
								Alasan Pembatalan (Opsional):
							</label>
							<textarea
								rows={2}
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
								placeholder="Contoh: Agenda diundur atau dipindahkan..."
								className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden resize-none"
							/>
						</div>

						<div className="flex items-center justify-end gap-2.5 pt-2">
							<button
								type="button"
								disabled={cancelling}
								onClick={() => setCancelModalOpen(false)}
								className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
							>
								Kembali
							</button>
							<button
								type="button"
								disabled={cancelling}
								onClick={handleCancelBooking}
								className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-all disabled:opacity-50"
							>
								{cancelling ? (
									<>
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
										Membatalkan...
									</>
								) : (
									"Ya, Batalkan Permohonan"
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
