import { AlertCircle, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
			<div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#e4e4e7] flex flex-col gap-5">
				<div className="flex items-start justify-between">
					<div className="flex flex-col gap-0.5">
						<h3 className="font-bold text-base text-[#09090b]">
							Tolak Permohonan Peminjaman
						</h3>
						<p className="text-xs text-[#71717a]">
							Permohonan oleh{" "}
							<span className="font-semibold">{requesterName}</span> (
							{assetName})
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-md transition-colors cursor-pointer"
					>
						<X size={18} />
					</button>
				</div>

				<form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
					{error && (
						<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
							<AlertCircle size={15} className="shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-[#09090b]">
							Kategori Alasan Penolakan
						</label>
						<select
							value={selectedPreset}
							onChange={(e) => handlePresetChange(e.target.value)}
							className="w-full px-3 py-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] focus:outline-none focus:border-[#09090b] focus:bg-white transition-all cursor-pointer"
						>
							{PRESET_REASONS.map((p) => (
								<option key={p.label} value={p.label}>
									{p.label}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold text-[#09090b]">
							Justifikasi / Keterangan Penolakan (Wajib)
						</label>
						<textarea
							rows={4}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Tuliskan penjelasan detail alasan penolakan..."
							required
							className="w-full px-3 py-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#09090b] focus:bg-white transition-all resize-y"
						/>
						<span className="text-[11px] text-[#71717a]">
							Alasan penolakan ini akan dicatat permanen dalam audit log sistem.
						</span>
					</div>

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4e4e7]">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="px-4 py-2 text-xs font-medium text-[#71717a] hover:bg-[#f4f4f5] rounded-lg transition-colors cursor-pointer"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
						>
							{submitting ? "Memproses..." : "Konfirmasi Tolak Permohonan"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
