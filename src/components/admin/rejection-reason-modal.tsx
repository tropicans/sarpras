import { AlertCircle, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface RejectionReasonModalProps {
	isOpen: boolean;
	bookingId: string;
	requesterName: string;
	assetName: string;
	onClose: () => void;
	onSubmit: (rejectionReason: string) => Promise<void>;
}

const PRESET_REASONS = [
	{
		label: "Jadwal Bertabrakan dengan Kegiatan Lain",
		text: "Jadwal yang diajukan bertabrakan dengan kegiatan prioritas kedinasan/peminjaman lain yang telah disetujui.",
	},
	{
		label: "Pemeliharaan / Penutupan Fasilitas",
		text: "Fasilitas sedang dalam masa perawatan berkala, renovasi, atau penutupan operasional pada jadwal tersebut.",
	},
	{
		label: "Kapasitas Fasilitas Tidak Memadai",
		text: "Jumlah peserta yang diajukan melebihi batas kapasitas maksimum daya tampung fasilitas.",
	},
	{
		label: "Tidak Memenuhi Ketentuan Peminjaman",
		text: "Permohonan tidak memenuhi syarat administrasi atau ketentuan tata tertib penggunaan sarana dan prasarana PPKASN.",
	},
	{
		label: "Lainnya (Tuliskan secara spesifik)",
		text: "",
	},
];

export function RejectionReasonModal({
	isOpen,
	requesterName,
	assetName,
	onClose,
	onSubmit,
}: RejectionReasonModalProps) {
	const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0].label);
	const [reason, setReason] = useState(PRESET_REASONS[0].text);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !submitting) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, submitting, onClose]);

	if (!isOpen) return null;

	const handlePresetChange = (presetLabel: string) => {
		setSelectedPreset(presetLabel);
		const found = PRESET_REASONS.find((p) => p.label === presetLabel);
		if (found) {
			setReason(found.text);
		}
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = reason.trim();
		if (!trimmed || trimmed.length < 3) {
			setError("Alasan penolakan minimal harus 3 karakter.");
			return;
		}

		try {
			setSubmitting(true);
			setError(null);
			await onSubmit(trimmed);
			onClose();
		} catch (err: any) {
			setError(err.message || "Gagal memproses penolakan permohonan.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="rejection-modal-title"
				className="bg-card text-foreground rounded-xl max-w-lg w-full p-6 shadow-2xl border border-border flex flex-col gap-5"
			>
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-0.5">
						<h3
							id="rejection-modal-title"
							className="font-bold text-base text-foreground"
						>
							Tolak Permohonan Peminjaman
						</h3>
						<p className="text-xs text-muted-foreground">
							Permohonan oleh{" "}
							<span className="font-semibold text-foreground">
								{requesterName}
							</span>{" "}
							({assetName})
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
						aria-label="Tutup dialog penolakan"
					>
						<X size={18} aria-hidden="true" />
					</button>
				</div>

				<form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
					{error && (
						<div
							role="alert"
							className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs flex items-center gap-2"
						>
							<AlertCircle size={15} className="shrink-0" aria-hidden="true" />
							<span>{error}</span>
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="rejection-preset-select"
							className="text-xs font-semibold text-foreground"
						>
							Kategori Alasan Penolakan
						</label>
						<select
							id="rejection-preset-select"
							value={selectedPreset}
							onChange={(e) => handlePresetChange(e.target.value)}
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-hidden focus:border-primary transition-all cursor-pointer font-medium"
						>
							{PRESET_REASONS.map((p) => (
								<option key={p.label} value={p.label}>
									{p.label}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="rejection-reason-textarea"
							className="text-xs font-semibold text-foreground"
						>
							Justifikasi / Keterangan Penolakan (Wajib)
						</label>
						<textarea
							id="rejection-reason-textarea"
							rows={4}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Tuliskan penjelasan detail alasan penolakan..."
							required
							aria-required="true"
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary transition-all resize-y"
						/>
						<span className="text-[11px] text-muted-foreground">
							Alasan penolakan ini akan dicatat permanen dalam audit log sistem.
						</span>
					</div>

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="px-4 py-2 text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90 rounded-lg transition-opacity shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{submitting ? "Memproses..." : "Konfirmasi Tolak Permohonan"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
