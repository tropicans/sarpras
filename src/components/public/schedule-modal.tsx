import {
	AlertCircle,
	Calendar,
	Clock,
	Lock,
	ShieldCheck,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAssetPublicScheduleFn } from "#/lib/booking/public-fns.server";

interface ScheduleModalProps {
	asset: {
		id: string;
		name: string;
		type: string;
		location: string | null;
		capacity: number;
	} | null;
	isOpen: boolean;
	onClose: () => void;
}

interface ScheduleData {
	bookedSlots: Array<{
		startDate: string;
		endDate: string;
		status: "booked";
	}>;
	closureSlots: Array<{
		startDate: string;
		endDate: string;
		reason: string | null;
		status: "closed";
	}>;
}

export function ScheduleModal({ asset, isOpen, onClose }: ScheduleModalProps) {
	const [schedule, setSchedule] = useState<ScheduleData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen || !asset) {
			setSchedule(null);
			setError(null);
			return;
		}

		let isMounted = true;
		setLoading(true);
		setError(null);

		getAssetPublicScheduleFn({ data: { assetId: asset.id } })
			.then((data) => {
				if (isMounted) {
					setSchedule(data);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (isMounted) {
					setError("Gagal memuat data jadwal sarana. Silakan coba kembali.");
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [isOpen, asset]);

	if (!isOpen || !asset) return null;

	const formatSlotTime = (isoString: string) => {
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

	const formatRange = (startIso: string, endIso: string) => {
		const s = new Date(startIso);
		const e = new Date(endIso);
		const sStr = s.toLocaleDateString("id-ID", {
			timeZone: "Asia/Jakarta",
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
		const eStr = e.toLocaleDateString("id-ID", {
			timeZone: "Asia/Jakarta",
			weekday: "short",
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${sStr} — ${eStr} WIB`;
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div
				className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
				role="dialog"
				aria-modal="true"
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/40">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Calendar className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-bold text-lg text-foreground">
								Jadwal Penggunaan Sarana
							</h3>
							<p className="text-xs text-muted-foreground">
								{asset.name} &bull; {asset.type === "room" ? "Ruang Rapat" : "Asrama / Wisma"}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label="Tutup Modal"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Privacy Notice Banner */}
				<div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
					<ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
					<span>
						<strong>Privasi Terlindungi:</strong> Tampilan jadwal publik hanya menampilkan blok waktu ketersediaan tanpa memuat informasi pribadi pemohon.
					</span>
				</div>

				{/* Modal Body */}
				<div className="p-6 overflow-y-auto space-y-6 flex-1">
					{loading && (
						<div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
							<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-sm text-muted-foreground">Memuat data ketersediaan jadwal...</p>
						</div>
					)}

					{error && (
						<div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive text-sm">
							<AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
							<p>{error}</p>
						</div>
					)}

					{!loading && !error && schedule && (
						<div className="space-y-6">
							{/* Closures Section */}
							{schedule.closureSlots.length > 0 && (
								<div className="space-y-2.5">
									<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
										<span className="h-2 w-2 rounded-full bg-amber-500" />
										Jadwal Penutupan / Pemeliharaan
									</h4>
									<div className="space-y-2">
										{schedule.closureSlots.map((slot, idx) => (
											<div
												key={`closure-${idx}`}
												className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start justify-between gap-4"
											>
												<div className="space-y-0.5">
													<div className="text-sm font-medium text-amber-900 dark:text-amber-200">
														{formatRange(slot.startDate, slot.endDate)}
													</div>
													<p className="text-xs text-amber-700/80 dark:text-amber-300/80">
														{slot.reason || "Penutupan Layanan / Hari Libur"}
													</p>
												</div>
												<span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 shrink-0">
													Tutup
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Booked Slots Section */}
							<div className="space-y-2.5">
								<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-blue-500" />
									Jadwal Peminjaman Disetujui
								</h4>
								{schedule.bookedSlots.length === 0 ? (
									<div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
										Belum ada jadwal peminjaman yang disetujui. Sarana saat ini siap dipinjam.
									</div>
								) : (
									<div className="space-y-2">
										{schedule.bookedSlots.map((slot, idx) => (
											<div
												key={`booked-${idx}`}
												className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between gap-4"
											>
												<div className="flex items-center gap-3">
													<Clock className="h-4 w-4 text-muted-foreground shrink-0" />
													<div>
														<div className="text-sm font-medium text-foreground">
															{formatRange(slot.startDate, slot.endDate)}
														</div>
														<p className="text-xs text-muted-foreground">
															Slot Terisi (Disetujui Petugas)
														</p>
													</div>
												</div>
												<span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 shrink-0">
													Terisi
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="border-t border-border/80 px-6 py-3.5 bg-muted/20 flex items-center justify-between">
					<div className="text-xs text-muted-foreground flex items-center gap-1.5">
						<Lock className="h-3.5 w-3.5" />
						Jadwal diperbarui secara real-time
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
