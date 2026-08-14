import {
	AlertCircle,
	Building,
	Calendar,
	CheckSquare,
	Clock,
	FileCheck,
	Loader2,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import type { RequesterStepData } from "./requester-step";
import type { ScheduleStepData } from "./schedule-step";

interface ReviewStepProps {
	asset: {
		id: string;
		name: string;
		type: string;
		capacity: number;
		location: string | null;
	};
	schedule: ScheduleStepData;
	requester: RequesterStepData;
	isSubmitting: boolean;
	errorMessage: string | null;
	onSubmit: () => void;
	onBack: () => void;
}

export function ReviewStep({
	asset,
	schedule,
	requester,
	isSubmitting,
	errorMessage,
	onSubmit,
	onBack,
}: ReviewStepProps) {
	const [agreed, setAgreed] = useState(false);
	const isRoom = asset.type === "room";

	const formatDateTime = (isoString: string) => {
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

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
				<div className="border-b border-border/60 pb-4">
					<h3 className="text-lg font-bold text-foreground">
						Konfirmasi Data Permohonan Peminjaman
					</h3>
					<p className="text-xs text-muted-foreground">
						Pastikan seluruh data jadwal dan identitas pemohon telah sesuai
						sebelum dikirimkan ke petugas verifikator.
					</p>
				</div>

				{/* Error Alert */}
				{errorMessage && (
					<div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive text-sm">
						<AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
						<div>
							<strong className="font-semibold">Pengajuan Gagal: </strong>
							<span>{errorMessage}</span>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Section 1: Asset & Schedule */}
					<div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
						<h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
							<Building className="h-3.5 w-3.5" />
							Rincian Sarana & Jadwal
						</h4>

						<div className="space-y-2 text-xs">
							<div>
								<span className="text-muted-foreground">Nama Sarana:</span>
								<p className="font-semibold text-foreground text-sm">
									{asset.name}
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">Tipe & Lokasi:</span>
								<p className="font-medium text-foreground">
									{isRoom ? "Ruang Rapat" : "Asrama / Wisma"} &bull;{" "}
									{asset.location || "Gedung Utama"}
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">Waktu Mulai:</span>
								<p className="font-medium text-foreground">
									{formatDateTime(schedule.startDate)} WIB
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">Waktu Selesai:</span>
								<p className="font-medium text-foreground">
									{formatDateTime(schedule.endDate)} WIB
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">
									Perkiraan Peserta:
								</span>
								<p className="font-semibold text-primary">
									{schedule.attendance} Orang (Kapasitas: {asset.capacity})
								</p>
							</div>
						</div>
					</div>

					{/* Section 2: Requester Info */}
					<div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
						<h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
							<User className="h-3.5 w-3.5" />
							Data Pemohon & Acara
						</h4>

						<div className="space-y-2 text-xs">
							<div>
								<span className="text-muted-foreground">Penanggung Jawab:</span>
								<p className="font-semibold text-foreground text-sm">
									{requester.requesterName}
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">Email:</span>
								<p className="font-medium text-foreground">
									{requester.requesterEmail}
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">
									No. Telepon/WhatsApp:
								</span>
								<p className="font-medium text-foreground">
									{requester.requesterPhone}
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">
									Unit Kerja / Instansi:
								</span>
								<p className="font-medium text-foreground">
									{requester.requesterOrganization}
								</p>
							</div>

							<div>
								<span className="text-muted-foreground">Tujuan / Agenda:</span>
								<p className="font-medium text-foreground italic">
									"{requester.purpose}"
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Terms Checkbox */}
				<div className="rounded-xl border border-border p-4 bg-background space-y-2">
					<label className="flex items-start gap-3 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
							className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
						/>
						<span className="text-xs text-foreground/90 leading-relaxed">
							Saya menyatakan bahwa data yang diisikan adalah benar dan bersedia
							mematuhi seluruh tata tertib penggunaan sarana serta ketentuan jam
							operasional di lingkungan PPKASN Kemenkes RI.
						</span>
					</label>
				</div>
			</div>

			{/* Action Nav */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					disabled={isSubmitting}
					onClick={onBack}
					className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
				>
					&larr; Ubah Data
				</button>
				<button
					type="button"
					disabled={!agreed || isSubmitting}
					onClick={onSubmit}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Mengirim Permohonan...
						</>
					) : (
						<>
							<FileCheck className="h-4 w-4" />
							Kirim Permohonan Peminjaman
						</>
					)}
				</button>
			</div>
		</div>
	);
}
