import {
	AlertCircle,
	Calendar,
	Clock,
	Lock,
	ShieldCheck,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAssetFacilities } from "#/lib/assets/facilities";
import { getAssetPublicScheduleFn } from "#/lib/booking/public-fns.functions";

interface ScheduleModalProps {
	asset: {
		id: string;
		name: string;
		type: string;
		location: string | null;
		capacity: number;
		facilities?: string[] | null;
	} | null;
	isOpen: boolean;
	onClose: () => void;
}

interface ScheduleData {
	bookedSlots: Array<{
		startDate: string;
		endDate: string;
		status: "booked";
		bookingStatus?: "approved" | "pending";
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
			.catch(() => {
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

	const facilities = getAssetFacilities(asset);

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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
			<div
				className="relative w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
				role="dialog"
				aria-modal="true"
			>
				{/* Modal Header */}
				<div className="border-b border-border px-5 py-3.5 bg-muted/30 space-y-2.5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
								<Calendar className="h-3.5 w-3.5" />
							</div>
							<div>
								<h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
									JADWAL FASILITAS // {asset.name}
								</h3>
								<p className="text-[11px] text-muted-foreground">
									{asset.location || "Gedung Utama PPKASN"} &bull; Kapasitas{" "}
									{asset.capacity} Orang
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
							aria-label="Tutup Modal"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* Facility tags */}
					{facilities.length > 0 && (
						<div className="flex flex-wrap gap-1 items-center pt-0.5">
							{facilities.map((fac, idx) => (
								<span
									key={idx}
									className="inline-flex items-center rounded border border-border/70 bg-card/80 px-2 py-0.5 text-[10px] text-foreground/80 font-medium shadow-2xs"
								>
									{fac}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Privacy Notice Banner */}
				<div className="bg-sky-500/10 border-b border-sky-500/20 px-5 py-2 flex items-center gap-2 text-[11px] font-mono text-sky-800 dark:text-sky-300">
					<ShieldCheck className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
					<span>
						<strong>PRIVACY PROTECTED:</strong> Hanya menampilkan blok waktu
						terisi tanpa data pribadi pemohon.
					</span>
				</div>

				{/* Modal Body */}
				<div className="p-5 overflow-y-auto space-y-4 flex-1">
					{loading && (
						<div className="py-10 flex flex-col items-center justify-center text-center space-y-2 font-mono">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							<p className="text-xs text-muted-foreground">
								MEMUAT JADWAL KETERSEDIAAN...
							</p>
						</div>
					)}

					{error && (
						<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2.5 text-destructive text-xs font-mono">
							<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
							<p>{error}</p>
						</div>
					)}

					{!loading && !error && schedule && (
						<div className="space-y-4">
							{/* Closures Section */}
							{schedule.closureSlots.length > 0 && (
								<div className="space-y-2">
									<div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
										<span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
										<span>Jadwal Penutupan / Maintenance</span>
									</div>
									<div className="space-y-1.5">
										{schedule.closureSlots.map((slot, idx) => (
											<div
												key={`closure-${idx}`}
												className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 flex items-start justify-between gap-3 font-mono"
											>
												<div className="space-y-0.5">
													<div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
														{formatRange(slot.startDate, slot.endDate)}
													</div>
													<p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
														{slot.reason || "Penutupan Layanan / Hari Libur"}
													</p>
												</div>
												<span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
													CLOSED
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Booked Slots Section */}
							<div className="space-y-2">
								<div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
									<span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
									<span>Jadwal Terisi / Dalam Pengajuan</span>
								</div>
								{schedule.bookedSlots.length === 0 ? (
									<div className="rounded-md border border-dashed border-border p-6 text-center text-xs font-mono text-muted-foreground">
										Belum ada jadwal peminjaman pada periode ini. Sarana siap
										diajukan.
									</div>
								) : (
									<div className="space-y-1.5">
										{schedule.bookedSlots.map((slot, idx) => {
											const isPending = slot.bookingStatus === "pending";
											return (
												<div
													key={`booked-${idx}`}
													className={`rounded-md border p-2.5 flex items-center justify-between gap-3 font-mono ${
														isPending
															? "border-amber-500/30 bg-amber-500/5"
															: "border-border bg-muted/40"
													}`}
												>
													<div className="flex items-center gap-2.5">
														<Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
														<div>
															<div className="text-xs font-medium text-foreground">
																{formatRange(slot.startDate, slot.endDate)}
															</div>
															<p className="text-[10px] text-muted-foreground">
																{isPending
																	? "Menunggu Verifikasi Admin"
																	: "Slot Terisi • Disetujui Petugas"}
															</p>
														</div>
													</div>
													<span
														className={`rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0 border ${
															isPending
																? "border-amber-500/30 bg-amber-500/20 text-amber-800 dark:text-amber-300"
																: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
														}`}
													>
														{isPending ? "PENDING" : "BOOKED"}
													</span>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between font-mono text-xs">
					<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
						<Lock className="h-3 w-3" />
						<span>REAL-TIME LIVE DATA</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
					>
						Tutup
					</button>
				</div>
			</div>
		</div>
	);
}
