import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	Info,
	Loader2,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkAvailabilityPreflightFn } from "#/lib/booking/public-fns.server";

export interface ScheduleStepData {
	startDate: string; // ISO string
	endDate: string; // ISO string
	dateOnly?: string; // YYYY-MM-DD
	startTime?: string; // HH:mm
	endTime?: string; // HH:mm
	checkInDate?: string; // YYYY-MM-DD
	checkOutDate?: string; // YYYY-MM-DD
	attendance: number;
}

interface ScheduleStepProps {
	asset: {
		id: string;
		name: string;
		type: string;
		capacity: number;
		location: string | null;
	};
	data: ScheduleStepData;
	onChange: (updated: Partial<ScheduleStepData>) => void;
	onNext: () => void;
}

export function ScheduleStep({
	asset,
	data,
	onChange,
	onNext,
}: ScheduleStepProps) {
	const isRoom = asset.type === "room";

	// Local form state
	const [dateStr, setDateStr] = useState(
		data.dateOnly || new Date().toISOString().split("T")[0],
	);
	const [startTime, setStartTime] = useState(data.startTime || "08:00");
	const [endTime, setEndTime] = useState(data.endTime || "12:00");

	const [checkInStr, setCheckInStr] = useState(
		data.checkInDate || new Date().toISOString().split("T")[0],
	);
	const [checkOutStr, setCheckOutStr] = useState(() => {
		if (data.checkOutDate) return data.checkOutDate;
		const tmrw = new Date();
		tmrw.setDate(tmrw.getDate() + 1);
		return tmrw.toISOString().split("T")[0];
	});

	const [attendance, setAttendance] = useState<number>(
		data.attendance || (isRoom ? Math.min(10, asset.capacity) : 1),
	);

	// Preflight check state
	const [checking, setChecking] = useState(false);
	const [availabilityResult, setAvailabilityResult] = useState<{
		available: boolean;
		reason?: string;
	} | null>(null);

	// Trigger preflight validation whenever inputs change
	useEffect(() => {
		let isCancelled = false;

		const runPreflight = async () => {
			let startIso = "";
			let endIso = "";

			if (isRoom) {
				if (!dateStr || !startTime || !endTime) return;
				startIso = new Date(`${dateStr}T${startTime}:00+07:00`).toISOString();
				endIso = new Date(`${dateStr}T${endTime}:00+07:00`).toISOString();
			} else {
				if (!checkInStr || !checkOutStr) return;
				startIso = new Date(`${checkInStr}T14:00:00+07:00`).toISOString();
				endIso = new Date(`${checkOutStr}T12:00:00+07:00`).toISOString();
			}

			if (new Date(startIso) >= new Date(endIso)) {
				setAvailabilityResult({
					available: false,
					reason: "Waktu selesai harus lebih akhir dari waktu mulai.",
				});
				return;
			}

			setChecking(true);
			try {
				const res = await checkAvailabilityPreflightFn({
					data: {
						assetId: asset.id,
						startDate: startIso,
						endDate: endIso,
						attendance,
					},
				});

				if (!isCancelled) {
					setAvailabilityResult(res);
					setChecking(false);

					// Sync parent state
					if (isRoom) {
						onChange({
							startDate: startIso,
							endDate: endIso,
							dateOnly: dateStr,
							startTime,
							endTime,
							attendance,
						});
					} else {
						onChange({
							startDate: startIso,
							endDate: endIso,
							checkInDate: checkInStr,
							checkOutDate: checkOutStr,
							attendance,
						});
					}
				}
			} catch (err: any) {
				if (!isCancelled) {
					setAvailabilityResult({
						available: false,
						reason: err.message || "Gagal memeriksa ketersediaan.",
					});
					setChecking(false);
				}
			}
		};

		const debounceTimer = setTimeout(runPreflight, 300);
		return () => {
			isCancelled = true;
			clearTimeout(debounceTimer);
		};
	}, [
		isRoom,
		dateStr,
		startTime,
		endTime,
		checkInStr,
		checkOutStr,
		attendance,
		asset.id,
	]);

	const isValid = availabilityResult?.available && !checking;

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
				<div className="border-b border-border/60 pb-4">
					<h3 className="text-lg font-bold text-foreground">
						{isRoom
							? "Tentukan Jadwal Penggunaan Ruangan"
							: "Tentukan Periode Menginap Asrama"}
					</h3>
					<p className="text-xs text-muted-foreground">
						Sistem akan secara otomatis memeriksa ketersediaan slot dan kapasitas
						aset secara real-time.
					</p>
				</div>

				{isRoom ? (
					/* Room Schedule Inputs */
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="space-y-1.5 sm:col-span-1">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Kegiatan
							</label>
							<input
								type="date"
								value={dateStr}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => setDateStr(e.target.value)}
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Clock className="h-3.5 w-3.5 text-primary" />
								Waktu Mulai (WIB)
							</label>
							<input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Clock className="h-3.5 w-3.5 text-primary" />
								Waktu Selesai (WIB)
							</label>
							<input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
						</div>
					</div>
				) : (
					/* Dormitory Schedule Inputs */
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Check-in
							</label>
							<input
								type="date"
								value={checkInStr}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => setCheckInStr(e.target.value)}
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
							<span className="text-[11px] text-muted-foreground">
								Check-in mulai pukul 14:00 WIB
							</span>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Check-out
							</label>
							<input
								type="date"
								value={checkOutStr}
								min={checkInStr}
								onChange={(e) => setCheckOutStr(e.target.value)}
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
							<span className="text-[11px] text-muted-foreground">
								Check-out maksimal pukul 12:00 WIB
							</span>
						</div>
					</div>
				)}

				{/* Attendance Input */}
				<div className="space-y-1.5 pt-2 border-t border-border/60">
					<div className="flex items-center justify-between">
						<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
							<Users className="h-3.5 w-3.5 text-primary" />
							{isRoom ? "Jumlah Peserta Rapat" : "Jumlah Tamu Menginap"}
						</label>
						<span className="text-xs text-muted-foreground">
							Maksimal kapasitas aset: <strong>{asset.capacity} orang</strong>
						</span>
					</div>
					<input
						type="number"
						min={1}
						max={asset.capacity}
						value={attendance}
						onChange={(e) => setAttendance(Number.parseInt(e.target.value) || 1)}
						className="w-full sm:w-48 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
						required
					/>
				</div>

				{/* Live Preflight Status Feedback */}
				<div className="pt-2">
					{checking ? (
						<div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin text-primary" />
							<span>Memeriksa ketersediaan jadwal dan kapasitas...</span>
						</div>
					) : availabilityResult ? (
						availabilityResult.available ? (
							<div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
								<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
								<span>
									<strong>Tersedia:</strong> Jadwal dan kapasitas yang dipilih
									tersedia untuk diajukan peminjaman.
								</span>
							</div>
						) : (
							<div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive">
								<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
								<div>
									<strong className="font-semibold">Tidak Tersedia: </strong>
									<span>
										{availabilityResult.reason ||
											"Jadwal tidak tersedia atau bertabrakan."}
									</span>
								</div>
							</div>
						)
					) : null}
				</div>
			</div>

			{/* Action Nav */}
			<div className="flex items-center justify-end">
				<button
					type="button"
					disabled={!isValid}
					onClick={onNext}
					className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					Lanjut ke Data Pemohon &rarr;
				</button>
			</div>
		</div>
	);
}
