import {
	AlertCircle,
	Check,
	CheckCircle2,
	Copy,
	KeyRound,
	QrCode,
	Shield,
	ShieldAlert,
	ShieldCheck,
	ShieldOff,
	X,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

interface TwoFactorSetupModalProps {
	isOpen: boolean;
	onClose: () => void;
	userTwoFactorEnabled: boolean;
	onStatusChange: (enabled: boolean) => void;
}

export function TwoFactorSetupModal({
	isOpen,
	onClose,
	userTwoFactorEnabled,
	onStatusChange,
}: TwoFactorSetupModalProps) {
	const [step, setStep] = useState<"initial" | "scan" | "backup" | "disable">(
		userTwoFactorEnabled ? "disable" : "initial",
	);
	const [totpUri, setTotpUri] = useState<string>("");
	const [secret, setSecret] = useState<string>("");
	const [backupCodes, setBackupCodes] = useState<string[]>([]);
	const [verifyCode, setVerifyCode] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copiedSecret, setCopiedSecret] = useState(false);
	const [copiedBackup, setCopiedBackup] = useState(false);

	if (!isOpen) return null;

	const handleStartEnable = async () => {
		setLoading(true);
		setError(null);
		try {
			// Call Better Auth twoFactor enable endpoint
			const res = await (authClient as any).twoFactor.enable({
				password: "", // Not required for passwordless OAuth
			});

			if (res.error) {
				throw new Error(res.error.message || "Gagal menginisialisasi 2FA.");
			}

			const uri = res.data?.totpURI || "";
			setTotpUri(uri);

			// Extract secret from URI if present
			const match = uri.match(/secret=([A-Z0-9]+)/i);
			if (match) {
				setSecret(match[1]);
			}

			if (res.data?.backupCodes) {
				setBackupCodes(res.data.backupCodes);
			}

			setStep("scan");
		} catch (err: any) {
			setError(err?.message || "Gagal mengaktifkan Two-Factor Authentication.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyAndConfirm = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!verifyCode.trim()) {
			setError("Masukkan kode 6-digit dari aplikasi Authenticator.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const res = await (authClient as any).twoFactor.verifyTotp({
				code: verifyCode.trim(),
			});

			if (res.error) {
				throw new Error(
					res.error.message || "Kode 6-digit tidak valid. Pastikan waktu di HP Anda akurat.",
				);
			}

			onStatusChange(true);
			setStep("backup");
		} catch (err: any) {
			setError(err?.message || "Gagal memverifikasi kode 2FA.");
		} finally {
			setLoading(false);
		}
	};

	const handleDisable = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await (authClient as any).twoFactor.disable({
				password: "",
			});

			if (res.error) {
				throw new Error(res.error.message || "Gagal menonaktifkan 2FA.");
			}

			onStatusChange(false);
			onClose();
		} catch (err: any) {
			setError(err?.message || "Gagal menonaktifkan Two-Factor Authentication.");
		} finally {
			setLoading(false);
		}
	};

	const handleCopySecret = () => {
		if (!secret) return;
		navigator.clipboard.writeText(secret);
		setCopiedSecret(true);
		setTimeout(() => setCopiedSecret(false), 3000);
	};

	const handleCopyBackupCodes = () => {
		if (backupCodes.length === 0) return;
		navigator.clipboard.writeText(backupCodes.join("\n"));
		setCopiedBackup(true);
		setTimeout(() => setCopiedBackup(false), 3000);
	};

	return (
		<div className="fixed inset-0 bg-[#09090b]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
			<div className="w-full max-w-[480px] bg-white border border-[#e4e4e7] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-[#e4e4e7] pb-4">
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
							<ShieldCheck size={22} />
						</div>
						<div>
							<h3 className="text-base font-bold text-[#09090b]">
								Google Authenticator (2FA)
							</h3>
							<p className="text-xs text-[#71717a]">
								Lapisan keamanan tambahan dengan kode 6-digit TOTP
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
					>
						<X size={18} />
					</button>
				</div>

				{/* Error Alert */}
				{error && (
					<div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
						<AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
						<span>{error}</span>
					</div>
				)}

				{/* STEP: Initial (Not yet enabled) */}
				{step === "initial" && (
					<div className="flex flex-col gap-4">
						<div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-2.5">
							<div className="flex items-center gap-2 font-semibold text-xs text-zinc-900">
								<Shield size={16} className="text-blue-600" />
								<span>Mengapa Mengaktifkan 2FA?</span>
							</div>
							<p className="text-xs text-zinc-600 leading-relaxed">
								Dengan 2FA, setiap kali Anda login dengan akun Google, sistem akan meminta
								kode verifikasi 6-digit dari aplikasi authenticator di ponsel Anda (Google
								Authenticator, Microsoft Authenticator, atau Authy) untuk mencegah akses tidak sah.
							</p>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleStartEnable}
								disabled={loading}
								className="px-4 py-2.5 bg-[#09090b] text-white text-xs font-semibold rounded-xl hover:bg-[#27272a] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
							>
								<QrCode size={16} />
								<span>{loading ? "Menyiapkan..." : "Mulai Aktivasi 2FA"}</span>
							</button>
						</div>
					</div>
				)}

				{/* STEP: Scan QR Code & Confirm */}
				{step === "scan" && (
					<form onSubmit={handleVerifyAndConfirm} className="flex flex-col gap-4">
						<div className="text-xs text-zinc-600 space-y-1">
							<p className="font-semibold text-zinc-900">1. Pindai QR Code di Ponsel Anda:</p>
							<p>Buka Google Authenticator &rarr; Tambah Akun (+) &rarr; Scan QR Code.</p>
						</div>

						{/* QR Code Container */}
						<div className="flex flex-col items-center justify-center p-4 bg-zinc-50 border border-zinc-200 rounded-xl gap-3">
							{totpUri ? (
								<img
									src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
										totpUri,
									)}`}
									alt="TOTP QR Code"
									className="w-44 h-44 rounded-lg bg-white p-2 border border-zinc-200 shadow-2xs"
								/>
							) : (
								<div className="w-44 h-44 flex items-center justify-center text-xs text-zinc-400">
									Memuat QR...
								</div>
							)}

							{/* Manual Secret Key */}
							{secret && (
								<div className="w-full flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono">
									<span className="truncate text-zinc-700 select-all font-semibold">
										{secret}
									</span>
									<button
										type="button"
										onClick={handleCopySecret}
										className="p-1 text-zinc-500 hover:text-zinc-900 shrink-0"
										title="Salin Secret Key"
									>
										{copiedSecret ? (
											<Check size={14} className="text-emerald-600" />
										) : (
											<Copy size={14} />
										)}
									</button>
								</div>
							)}
						</div>

						{/* Verification Code Input */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-zinc-900">
								2. Masukkan 6-Digit Kode Konfirmasi dari Aplikasi:
							</label>
							<input
								type="text"
								inputMode="numeric"
								required
								maxLength={6}
								value={verifyCode}
								onChange={(e) => setVerifyCode(e.target.value)}
								placeholder="Misal: 482910"
								className="px-3.5 py-2.5 border border-[#e4e4e7] rounded-xl text-center text-base font-mono tracking-widest focus:ring-2 focus:ring-[#09090b] focus:outline-none"
							/>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4e4e7]">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={loading || verifyCode.trim().length < 6}
								className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
							>
								<CheckCircle2 size={16} />
								<span>{loading ? "Memverifikasi..." : "Verifikasi & Aktifkan"}</span>
							</button>
						</div>
					</form>
				)}

				{/* STEP: Backup Codes Display */}
				{step === "backup" && (
					<div className="flex flex-col gap-4">
						<div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-start gap-3">
							<CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-bold text-xs">2FA Berhasil Diaktifkan!</p>
								<p className="text-xs text-emerald-700 leading-relaxed">
									Simpan kode cadangan darurat (Backup Codes) di bawah ini di tempat aman. Kode
									ini dapat digunakan jika Anda kehilangan akses ke ponsel.
								</p>
							</div>
						</div>

						{/* Backup codes grid */}
						<div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-3">
							<div className="flex items-center justify-between text-xs text-zinc-600">
								<span className="font-semibold flex items-center gap-1.5">
									<KeyRound size={14} />
									<span>Kode Cadangan (One-Time Use):</span>
								</span>
								<button
									type="button"
									onClick={handleCopyBackupCodes}
									className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
								>
									{copiedBackup ? (
										<>
											<Check size={13} className="text-emerald-600" />
											<span className="text-emerald-600">Tersalin!</span>
										</>
									) : (
										<>
											<Copy size={13} />
											<span>Salin Semua</span>
										</>
									)}
								</button>
							</div>

							<div className="grid grid-cols-2 gap-2 font-mono text-xs text-zinc-800 bg-white p-3 rounded-lg border border-zinc-200 select-all">
								{backupCodes.map((c, i) => (
									<div key={i} className="p-1 bg-zinc-50 rounded text-center">
										{c}
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-end pt-2">
							<button
								type="button"
								onClick={onClose}
								className="px-5 py-2.5 bg-[#09090b] text-white text-xs font-semibold rounded-xl hover:bg-[#27272a] transition-all cursor-pointer shadow-xs"
							>
								Saya Sudah Menyimpan Kode
							</button>
						</div>
					</div>
				)}

				{/* STEP: Disable 2FA */}
				{step === "disable" && (
					<div className="flex flex-col gap-4">
						<div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3">
							<ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-bold text-xs">2FA Sedang Aktif pada Akun Anda</p>
								<p className="text-xs text-amber-800 leading-relaxed">
									Akun Anda saat ini dilindungi dengan Google Authenticator. Jika Anda
									menonaktifkannya, login Google Anda tidak akan lagi memerlukan verifikasi
									PIN 6-digit.
								</p>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
							>
								Tutup
							</button>
							<button
								type="button"
								onClick={handleDisable}
								disabled={loading}
								className="px-4 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
							>
								<ShieldOff size={16} />
								<span>{loading ? "Menonaktifkan..." : "Nonaktifkan 2FA"}</span>
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
