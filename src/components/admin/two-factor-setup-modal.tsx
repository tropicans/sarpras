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
			const res = await (authClient as any).twoFactor.enable({});

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
			const res = await (authClient as any).twoFactor.disable({});

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
		<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
			<div className="w-full max-w-[480px] bg-card text-foreground border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-border pb-4">
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
							<ShieldCheck size={22} />
						</div>
						<div>
							<h3 className="text-base font-bold text-foreground">
								Google Authenticator (2FA)
							</h3>
							<p className="text-xs text-muted-foreground">
								Lapisan keamanan tambahan dengan kode 6-digit TOTP
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
					>
						<X size={18} />
					</button>
				</div>

				{/* Error Alert */}
				{error && (
					<div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-2.5">
						<AlertCircle size={16} className="shrink-0 mt-0.5" />
						<span>{error}</span>
					</div>
				)}

				{/* STEP: Initial (Not yet enabled) */}
				{step === "initial" && (
					<div className="flex flex-col gap-4">
						<div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col gap-2.5">
							<div className="flex items-center gap-2 font-semibold text-xs text-foreground">
								<Shield size={16} className="text-blue-600 dark:text-blue-400" />
								<span>Mengapa Mengaktifkan 2FA?</span>
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Dengan 2FA, setiap kali Anda login dengan akun Google, sistem akan meminta
								kode verifikasi 6-digit dari aplikasi authenticator di ponsel Anda (Google
								Authenticator, Microsoft Authenticator, atau Authy) untuk mencegah akses tidak sah.
							</p>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleStartEnable}
								disabled={loading}
								className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
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
						<div className="text-xs text-muted-foreground space-y-1">
							<p className="font-semibold text-foreground">1. Pindai QR Code di Ponsel Anda:</p>
							<p>Buka Google Authenticator &rarr; Tambah Akun (+) &rarr; Scan QR Code.</p>
						</div>

						{/* QR Code Container */}
						<div className="flex flex-col items-center justify-center p-4 bg-muted/40 border border-border rounded-xl gap-3">
							{totpUri ? (
								<img
									src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
										totpUri,
									)}`}
									alt="TOTP QR Code"
									className="w-44 h-44 rounded-lg bg-white p-2 border border-border shadow-2xs"
								/>
							) : (
								<div className="w-44 h-44 flex items-center justify-center text-xs text-muted-foreground">
									Memuat QR...
								</div>
							)}

							{/* Manual Secret Key */}
							{secret && (
								<div className="w-full flex items-center justify-between gap-2 p-2 bg-background border border-border rounded-lg text-xs font-mono">
									<span className="truncate text-foreground select-all font-semibold">
										{secret}
									</span>
									<button
										type="button"
										onClick={handleCopySecret}
										className="p-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
										title="Salin Secret Key"
									>
										{copiedSecret ? (
											<Check size={14} className="text-emerald-600 dark:text-emerald-400" />
										) : (
											<Copy size={14} />
										)}
									</button>
								</div>
							)}
						</div>

						{/* Verification Code Input */}
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-foreground">
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
								className="px-3.5 py-2.5 bg-background border border-border text-foreground rounded-xl text-center text-base font-mono tracking-widest focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/60"
							/>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
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
						<div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-start gap-3">
							<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-bold text-xs text-emerald-900 dark:text-emerald-200">2FA Berhasil Diaktifkan!</p>
								<p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
									Simpan kode cadangan darurat (Backup Codes) di bawah ini di tempat aman. Kode
									ini dapat digunakan jika Anda kehilangan akses ke ponsel.
								</p>
							</div>
						</div>

						{/* Backup codes grid */}
						<div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col gap-3">
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span className="font-semibold flex items-center gap-1.5 text-foreground">
									<KeyRound size={14} />
									<span>Kode Cadangan (One-Time Use):</span>
								</span>
								<button
									type="button"
									onClick={handleCopyBackupCodes}
									className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
								>
									{copiedBackup ? (
										<>
											<Check size={13} className="text-emerald-600 dark:text-emerald-400" />
											<span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
										</>
									) : (
										<>
											<Copy size={13} />
											<span>Salin Semua</span>
										</>
									)}
								</button>
							</div>

							<div className="grid grid-cols-2 gap-2 font-mono text-xs text-foreground bg-background p-3 rounded-lg border border-border select-all">
								{backupCodes.map((c, i) => (
									<div key={i} className="p-1.5 bg-muted/40 rounded text-center border border-border/50">
										{c}
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-end pt-2">
							<button
								type="button"
								onClick={onClose}
								className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-xs"
							>
								Saya Sudah Menyimpan Kode
							</button>
						</div>
					</div>
				)}

				{/* STEP: Disable 2FA */}
				{step === "disable" && (
					<div className="flex flex-col gap-4">
						<div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl flex items-start gap-3">
							<ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-bold text-xs text-amber-900 dark:text-amber-200">2FA Sedang Aktif pada Akun Anda</p>
								<p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
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
								className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
							>
								Tutup
							</button>
							<button
								type="button"
								onClick={handleDisable}
								disabled={loading}
								className="px-4 py-2.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
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
