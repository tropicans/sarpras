import {
	AlertCircle,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	DoorOpen,
	Loader2,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkAvailabilityPreflightFn } from "#/lib/booking/public-fns.functions";
import { ASSET_TYPE_LABELS, type AssetType } from "#/lib/booking/types";

export interface ScheduleStepData {
	startDate: string; // ISO string
	endDate: string; // ISO string
	startDateOnly?: string; // YYYY-MM-DD
	endDateOnly?: string; // YYYY-MM-DD
	dateOnly?: string; // Legacy fallback YYYY-MM-DD
	startTime?: string; // HH:mm
	endTime?: string; // HH:mm
	checkInDate?: string; // YYYY-MM-DD
	checkOutDate?: string; // YYYY-MM-DD
	attendance: number;
}

export interface AdditionalRoomSelection {
	id: string;
	asset: {
		id: string;
		name: string;
		type: string;
		capacity: number;
		location: string | null;
	};
	schedule: ScheduleStepData;
	available?: boolean;
	availabilityReason?: string;
	checking?: boolean;
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
	additionalRooms: AdditionalRoomSelection[];
	onAddRoom: (asset: any) => void;
	onRemoveRoom: (selectionId: string) => void;
	onUpdateAdditionalRoom: (
		selectionId: string,
		updated: Partial<ScheduleStepData>,
	) => void;
	availableAssets: Array<{
		id: string;
		name: string;
		type: string;
		capacity: number;
		location: string | null;
	}>;
	onNext: () => void;
}

export function ScheduleStep({
	asset,
	data,
	onChange,
	additionalRooms,
	onAddRoom,
	onRemoveRoom,
	onUpdateAdditionalRoom,
	availableAssets,
	onNext,
}: ScheduleStepProps) {
	const isRoom = asset.type === "room";

	// Local primary form state
	const [startDateStr, setStartDateStr] = useState(
		data.startDateOnly || data.dateOnly || new Date().toISOString().split("T")[0],
	);
	const [endDateStr, setEndDateStr] = useState(
		data.endDateOnly ||
			data.dateOnly ||
			data.startDateOnly ||
			new Date().toISOString().split("T")[0],
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

	// Preflight check state for primary room
	const [checking, setChecking] = useState(false);
	const [availabilityResult, setAvailabilityResult] = useState<{
		available: boolean;
		reason?: string;
	} | null>(null);

	// Dropdown selector state
	const [selectedAssetToAdd, setSelectedAssetToAdd] = useState<string>("");

	// Available rooms list (allows selecting other rooms or the same room for multiple dates/sessions)
	const availableRoomOptions = availableAssets.filter(
		(a) => a.type === "room" || a.type === asset.type,
	);

	// Trigger preflight validation for primary room whenever inputs change
	useEffect(() => {
		let isCancelled = false;

		const runPreflight = async () => {
			let startIso = "";
			let endIso = "";

			if (isRoom) {
				if (!startDateStr || !endDateStr || !startTime || !endTime) return;
				startIso = new Date(
					`${startDateStr}T${startTime}:00+07:00`,
				).toISOString();
				endIso = new Date(`${endDateStr}T${endTime}:00+07:00`).toISOString();
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
							startDateOnly: startDateStr,
							endDateOnly: endDateStr,
							dateOnly: startDateStr,
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
		startDateStr,
		endDateStr,
		startTime,
		endTime,
		checkInStr,
		checkOutStr,
		attendance,
		asset.id,
	]);

	const handleAddRoomClick = () => {
		if (!selectedAssetToAdd) return;
		const found = availableAssets.find((a) => a.id === selectedAssetToAdd);
		if (found) {
			onAddRoom(found);
			setSelectedAssetToAdd("");
		}
	};

	const isPrimaryValid = availabilityResult?.available && !checking;
	const areAllAdditionalValid = additionalRooms.every(
		(r) => r.available !== false && !r.checking,
	);
	const isValid = isPrimaryValid && areAllAdditionalValid;

	return (
		<div className="space-y-6">
			{/* Primary Room Card */}
			<div className="rounded-lg border border-border bg-card p-5 space-y-5">
				<div className="border-b border-border pb-3 flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
								RUANGAN UTAMA
							</span>
							<h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
								{asset.name}
							</h3>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							{isRoom
								? "Tentukan jadwal pelaksanaan dan estimasi jumlah peserta."
								: "Tentukan periode menginap di asrama."}
						</p>
					</div>
					<div className="font-mono text-xs text-muted-foreground">
						Maks. <strong>{asset.capacity}</strong> Pax
					</div>
				</div>

				{isRoom ? (
					/* Room Schedule Inputs (Tanggal Mulai & Tanggal Selesai) */
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="space-y-1">
							<label className="font-mono text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Mulai
							</label>
							<input
								type="date"
								value={startDateStr}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => {
									const val = e.target.value;
									setStartDateStr(val);
									if (endDateStr < val) {
										setEndDateStr(val);
									}
								}}
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
								<Calendar className="h-3.5 w-3.5 text-primary" />
								Tanggal Selesai
							</label>
							<input
								type="date"
								value={endDateStr}
								min={startDateStr}
								onChange={(e) => setEndDateStr(e.target.value)}
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
									<strong>[TERSEDIA]:</strong> Jadwal siap diajukan untuk {asset.name}.
								</span>
							</div>
						) : (
							<div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
								<AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
								<div>
									<strong>[TIDAK TERSEDIA]: </strong>
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

			{/* Additional Rooms Section */}
			{isRoom && (
				<div className="space-y-4">
					{additionalRooms.length > 0 && (
						<div className="space-y-3">
							<h4 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
								RUANGAN TAMBAHAN ({additionalRooms.length})
							</h4>

							{additionalRooms.map((item) => (
								<AdditionalRoomCard
									key={item.id}
									item={item}
									parentStartDate={startDateStr}
									parentEndDate={endDateStr}
									parentStartTime={startTime}
									parentEndTime={endTime}
									onUpdate={(upd) => onUpdateAdditionalRoom(item.id, upd)}
									onRemove={() => onRemoveRoom(item.id)}
								/>
							))}
						</div>
					)}

					{/* Add Room Bar */}
					{availableRoomOptions.length > 0 && (
						<div className="rounded-lg border border-dashed border-border p-4 bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
							<div className="flex-1">
								<label className="font-mono text-[11px] font-semibold text-muted-foreground block mb-1">
									PINJAM RUANGAN LAIN ATAU TANGGAL/SESI TAMBAHAN?
								</label>
								<select
									value={selectedAssetToAdd}
									onChange={(e) => setSelectedAssetToAdd(e.target.value)}
									className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-hidden"
								>
									<option value="">-- Pilih Ruangan / Sesi Tambahan --</option>
									{availableRoomOptions.map((a) => (
										<option key={a.id} value={a.id}>
											{a.name}{" "}
											{a.id === asset.id
												? "(Sesi/Tanggal Tambahan)"
												: `(${a.location || "PPKASN"})`}{" "}
											- Kapasitas {a.capacity} Pax
										</option>
									))}
								</select>
							</div>
							<button
								type="button"
								disabled={!selectedAssetToAdd}
								onClick={handleAddRoomClick}
								className="inline-flex items-center justify-center gap-1.5 rounded-md bg-secondary px-4 py-2 font-mono text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer self-end sm:self-auto h-9"
							>
								<Plus className="h-3.5 w-3.5" />
								<span>+ TAMBAH RUANGAN</span>
							</button>
						</div>
					)}
				</div>
			)}

			{/* Action Nav */}
			<div className="flex items-center justify-between font-mono pt-2 border-t border-border">
				<span className="text-xs text-muted-foreground">
					Total fasilitas: <strong>{1 + additionalRooms.length} Ruangan</strong>
				</span>
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

function AdditionalRoomCard({
	item,
	parentStartDate,
	parentEndDate,
	parentStartTime,
	parentEndTime,
	onUpdate,
	onRemove,
}: {
	item: AdditionalRoomSelection;
	parentStartDate: string;
	parentEndDate: string;
	parentStartTime: string;
	parentEndTime: string;
	onUpdate: (upd: Partial<ScheduleStepData>) => void;
	onRemove: () => void;
}) {
	const asset = item.asset;
	const [attendance, setAttendance] = useState(
		item.schedule.attendance || Math.min(10, asset.capacity),
	);
	const [checking, setChecking] = useState(false);
	const [result, setResult] = useState<{
		available: boolean;
		reason?: string;
	} | null>(null);

	// By default synced with primary room timings unless custom
	const startDateStr =
		item.schedule.startDateOnly || item.schedule.dateOnly || parentStartDate;
	const endDateStr =
		item.schedule.endDateOnly ||
		item.schedule.dateOnly ||
		item.schedule.startDateOnly ||
		parentEndDate;
	const startTime = item.schedule.startTime || parentStartTime;
	const endTime = item.schedule.endTime || parentEndTime;

	useEffect(() => {
		let isCancelled = false;
		const check = async () => {
			if (!startDateStr || !endDateStr || !startTime || !endTime) return;
			const startIso = new Date(
				`${startDateStr}T${startTime}:00+07:00`,
			).toISOString();
			const endIso = new Date(
				`${endDateStr}T${endTime}:00+07:00`,
			).toISOString();

			if (new Date(startIso) >= new Date(endIso)) {
				setResult({
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
					setResult(res as { available: boolean; reason?: string });
					setChecking(false);
					onUpdate({
						startDate: startIso,
						endDate: endIso,
						startDateOnly: startDateStr,
						endDateOnly: endDateStr,
						dateOnly: startDateStr,
						startTime,
						endTime,
						attendance,
					});
				}
			} catch (err: any) {
				if (!isCancelled) {
					setResult({
						available: false,
						reason: err.message || "Gagal memeriksa ketersediaan.",
					});
					setChecking(false);
				}
			}
		};

		const t = setTimeout(check, 300);
		return () => {
			isCancelled = true;
			clearTimeout(t);
		};
	}, [asset.id, startDateStr, endDateStr, startTime, endTime, attendance]);

	return (
		<div className="rounded-lg border border-border bg-card p-4 space-y-3 font-mono text-xs">
			<div className="flex items-center justify-between border-b border-border pb-2">
				<div className="flex items-center gap-2">
					<DoorOpen className="h-3.5 w-3.5 text-secondary-foreground" />
					<strong className="text-foreground">{asset.name}</strong>
					<span className="text-[10px] text-muted-foreground">
						({asset.location || "PPKASN"} &bull; Kapasitas {asset.capacity} Pax)
					</span>
				</div>
				<button
					type="button"
					onClick={onRemove}
					className="text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10 cursor-pointer transition-colors"
					title="Hapus Ruangan"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-center">
				<div>
					<label className="text-[10px] text-muted-foreground block">
						Tgl Mulai
					</label>
					<input
						type="date"
						value={startDateStr}
						min={new Date().toISOString().split("T")[0]}
						onChange={(e) => {
							const val = e.target.value;
							const newEnd = endDateStr < val ? val : endDateStr;
							onUpdate({ startDateOnly: val, endDateOnly: newEnd });
						}}
						className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
				<div>
					<label className="text-[10px] text-muted-foreground block">
						Jam Mulai
					</label>
					<input
						type="time"
						value={startTime}
						onChange={(e) => onUpdate({ startTime: e.target.value })}
						className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
				<div>
					<label className="text-[10px] text-muted-foreground block">
						Tgl Selesai
					</label>
					<input
						type="date"
						value={endDateStr}
						min={startDateStr}
						onChange={(e) => onUpdate({ endDateOnly: e.target.value })}
						className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
				<div>
					<label className="text-[10px] text-muted-foreground block">
						Jam Selesai
					</label>
					<input
						type="time"
						value={endTime}
						onChange={(e) => onUpdate({ endTime: e.target.value })}
						className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
				<div>
					<label className="text-[10px] text-muted-foreground block">
						Peserta (Maks: {asset.capacity})
					</label>
					<input
						type="number"
						min={1}
						max={asset.capacity}
						value={attendance}
						onChange={(e) => {
							const val = Number.parseInt(e.target.value) || 1;
							setAttendance(val);
							onUpdate({ attendance: val });
						}}
						className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
			</div>

			{/* Status feedback */}
			{checking ? (
				<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
					<Loader2 className="h-3 w-3 animate-spin text-primary" />
					<span>Memeriksa ketersediaan...</span>
				</div>
			) : result ? (
				result.available ? (
					<div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
						<CheckCircle2 className="h-3 w-3" />
						<span>Tersedia</span>
					</div>
				) : (
					<div className="text-[11px] text-destructive flex items-center gap-1.5">
						<AlertCircle className="h-3 w-3" />
						<span>{result.reason || "Tidak tersedia"}</span>
					</div>
				)
			) : null}
		</div>
	);
}

