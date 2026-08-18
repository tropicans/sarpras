import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	Loader2,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkAvailabilityPreflightFn } from "#/lib/booking/public-fns.functions";

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
					setAvailabilityResult(res as { available: boolean; reason?: string });
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
		<div className="space-y-4">
			<div className="rounded-lg border border-border bg-card p-5 space-y-5">
				<div className="border-b border-border pb-3">
					<h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
						{isRoom
							? "TENTUKAN JADWAL RUANGAN // WIB"
							: "TENTUKAN PERIODE MENGINAP // ASRAMA"}
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Sistem akan secara otomatis memverifikasi ketersediaan slot secara real-time.
					</p>
				</div>

				{isRoom ? (
					/* Room Schedule Inputs */
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div className="space-y-1 sm:col-span-1">
							<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Kegiatan
							</label>
							<input
								type="date"
								value={dateStr}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => setDateStr(e.target.value)}
								className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
						</div>

						<div className="space-y-1">
							<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Clock className="h-3.5 w-3.5 text-primary" />
								Waktu Mulai
							</label>
							<input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
						</div>

						<div className="space-y-1">
							<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Clock className="h-3.5 w-3.5 text-primary" />
								Waktu Selesai
							</label>
							<input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
						</div>
					</div>
				) : (
					/* Dormitory Schedule Inputs */
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Check-in
							</label>
							<input
								type="date"
								value={checkInStr}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => setCheckInStr(e.target.value)}
								className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
							<span className="font-mono text-[10px] text-muted-foreground block">
								Check-in mulai 14:00 WIB
							</span>
						</div>

						<div className="space-y-1">
							<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Check-out
							</label>
							<input
								type="date"
								value={checkOutStr}
								min={checkInStr}
								onChange={(e) => setCheckOutStr(e.target.value)}
								className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
								required
							/>
							<span className="font-mono text-[10px] text-muted-foreground block">
								Check-out maksimal 12:00 WIB
							</span>
						</div>
					</div>
				)}

				{/* Attendance Input */}
				<div className="space-y-1 pt-2 border-t border-border">
					<div className="flex items-center justify-between">
						<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
							<Users className="h-3.5 w-3.5 text-primary" />
							{isRoom ? "Jumlah Peserta Rapat" : "Jumlah Tamu Menginap"}
						</label>
						<span className="font-mono text-[10px] text-muted-foreground">
							Kapasitas maksimal: <strong className="text-foreground">{asset.capacity}</strong>
						</span>
					</div>
					<input
						type="number"
						min={1}
						max={asset.capacity}
						value={attendance}
						onChange={(e) =>
							setAttendance(Number.parseInt(e.target.value) || 1)
						}
						className="w-full sm:w-44 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
						required
					/>
				</div>

				{/* Live Preflight Status Feedback */}
				<div>
					{checking ? (
						<div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
							<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
							<span>MEMERIKSA KETERSEDIAAN JADWAL...</span>
						</div>
					) : availabilityResult ? (
						availabilityResult.available ? (
							<div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-800 dark:text-emerald-300">
								<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
								<span>
									<strong>[AVAILABLE]:</strong> Jadwal dan kapasitas yang dipilih siap untuk diajukan.
								</span>
							</div>
						) : (
							<div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
								<AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
								<div>
									<strong>[UNAVAILABLE]: </strong>
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
			<div className="flex items-center justify-end font-mono">
				<button
					type="button"
					disabled={!isValid}
					onClick={onNext}
					className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
				>
					<span>LANJUT KE DATA PEMOHON</span>
					<span>&rarr;</span>
				</button>
			</div>
		</div>
	);
}
