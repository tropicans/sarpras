import {
	AlertCircle,
	Building,
	FileCheck,
	Loader2,
	User,
} from "lucide-react";
import { useState } from "react";
import type { RequesterStepData } from "./requester-step";
import type {
	AdditionalRoomSelection,
	ScheduleStepData,
} from "./schedule-step";

interface ReviewStepProps {
	asset: {
		id: string;
		name: string;
		type: string;
		capacity: number;
		location: string | null;
	};
	schedule: ScheduleStepData;
	additionalRooms?: AdditionalRoomSelection[];
	requester: RequesterStepData;
	isSubmitting: boolean;
	errorMessage: string | null;
	onSubmit: () => void;
	onBack: () => void;
}

export function ReviewStep({
	asset,
	schedule,
	additionalRooms = [],
	requester,
	isSubmitting,
	errorMessage,
	onSubmit,
	onBack,
}: ReviewStepProps) {
	const [agreed, setAgreed] = useState(false);
	const isRoom = asset.type === "room";
	const allRooms = [
		{
			asset,
			schedule,
			isPrimary: true,
		},
		...additionalRooms.map((r) => ({
			asset: r.asset,
			schedule: r.schedule,
			isPrimary: false,
		})),
	];

	const formatDateTime = (isoString: string) => {
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

	return (
		<div className="space-y-4 font-mono text-xs">
			<div className="rounded-lg border border-border bg-card p-5 space-y-4">
				<div className="border-b border-border pb-3">
					<h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
						KONFIRMASI AKHIR // REVIEW DATA PERMOHONAN
					</h3>
					<p className="text-[11px] text-muted-foreground mt-0.5 font-sans">
						Pastikan rincian sarana, waktu pelaksanaan, dan kontak pemohon telah benar sebelum mengirimkan permohonan.
					</p>
				</div>

				{/* Error Alert */}
				{errorMessage && (
					<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2.5 text-destructive text-xs">
						<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
						<div>
							<strong>[PENGAJUAN GAGAL]: </strong>
							<span>{errorMessage}</span>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{/* Section 1: Asset & Schedule (Multi-Room Support) */}
					<div className="rounded border border-border bg-muted/30 p-3.5 space-y-3">
						<span className="text-[10px] uppercase text-primary font-bold flex items-center justify-between">
							<span className="flex items-center gap-1.5">
								<Building className="h-3.5 w-3.5" />
								RINCIAN FASILITAS ({allRooms.length} RUANGAN)
							</span>
						</span>

						<div className="space-y-2.5 pt-1 text-xs max-h-[260px] overflow-y-auto pr-1">
							{allRooms.map((room, idx) => (
								<div
									key={room.asset.id}
									className="rounded border border-border/60 bg-background/80 p-2.5 space-y-1"
								>
									<div className="flex justify-between items-center border-b border-border/40 pb-1">
										<span className="font-bold text-foreground flex items-center gap-1.5">
											{room.isPrimary && (
												<span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 rounded font-mono">
													UTAMA
												</span>
											)}
											{room.asset.name}
										</span>
										<span className="text-[10px] text-muted-foreground">
											Kapasitas: {room.asset.capacity} Pax
										</span>
									</div>

									<div className="flex justify-between text-[11px]">
										<span className="text-muted-foreground">Jadwal:</span>
										<span className="font-semibold text-foreground">
											{formatDateTime(room.schedule.startDate)} s.d.{" "}
											{formatDateTime(room.schedule.endDate)}
										</span>
									</div>

									<div className="flex justify-between text-[11px]">
										<span className="text-muted-foreground">Peserta:</span>
										<span className="font-bold text-primary">
											{room.schedule.attendance} Pax
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Section 2: Requester Info */}
					<div className="rounded border border-border bg-muted/30 p-3.5 space-y-2">
						<span className="text-[10px] uppercase text-primary font-bold flex items-center gap-1.5">
							<User className="h-3.5 w-3.5" />
							DATA PEMOHON & ACARA
						</span>

						<div className="space-y-1.5 pt-1 text-xs">
							<div className="flex justify-between border-b border-border/40 pb-1">
								<span className="text-muted-foreground">Nama</span>
								<span className="font-semibold text-foreground">{requester.requesterName}</span>
							</div>

							<div className="flex justify-between border-b border-border/40 pb-1">
								<span className="text-muted-foreground">Email</span>
								<span className="font-semibold text-foreground">{requester.requesterEmail}</span>
							</div>

							<div className="flex justify-between border-b border-border/40 pb-1">
								<span className="text-muted-foreground">WhatsApp</span>
								<span className="font-semibold text-foreground">{requester.requesterPhone}</span>
							</div>

							<div className="flex justify-between border-b border-border/40 pb-1">
								<span className="text-muted-foreground">Instansi</span>
								<span className="font-semibold text-foreground truncate max-w-[160px] text-right">
									{requester.requesterOrganization}
								</span>
							</div>

							<div>
								<span className="text-muted-foreground block">Agenda:</span>
								<p className="font-sans text-xs text-foreground italic mt-0.5">
									"{requester.purpose}"
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Terms Checkbox */}
				<div className="rounded border border-border p-3 bg-background font-sans">
					<label className="flex items-start gap-2.5 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
							className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
						/>
						<span className="text-[11px] text-foreground/90 leading-relaxed">
							Saya menyatakan bahwa data yang diisikan adalah benar dan bersedia mematuhi seluruh tata tertib penggunaan fasilitas PPKASN Kementerian Sekretariat Negara RI.
						</span>
					</label>
				</div>
			</div>

			{/* Action Nav */}
			<div className="flex items-center justify-between font-mono">
				<button
					type="button"
					disabled={isSubmitting}
					onClick={onBack}
					className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
				>
					&larr; UBAH DATA
				</button>
				<button
					type="button"
					disabled={!agreed || isSubmitting}
					onClick={onSubmit}
					className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
							<span>MENGIRIM PERMOHONAN...</span>
						</>
					) : (
						<>
							<FileCheck className="h-3.5 w-3.5" />
							<span>[KIRIM PERMOHONAN ({allRooms.length} RUANGAN)]</span>
						</>
					)}
				</button>
			</div>
		</div>
	);
}
