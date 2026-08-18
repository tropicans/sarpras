import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	KeyRound,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "#/components/ui/theme-toggle";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/two-factor")({
	component: TwoFactorVerificationComponent,
});

function TwoFactorVerificationComponent() {
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const [useBackupCode, setUseBackupCode] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanCode = code.trim();
		if (!cleanCode) {
			setError("Silakan masukkan kode autentikasi.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			if (useBackupCode) {
				const res = await (authClient as any).twoFactor.verifyBackupCode({
					code: cleanCode,
				});
				if (res.error) {
					throw new Error(res.error.message || "Kode cadangan tidak valid.");
				}
			} else {
				const res = await (authClient as any).twoFactor.verifyTotp({
					code: cleanCode,
				});
				if (res.error) {
					throw new Error(
						res.error.message || "Kode verifikasi 6-digit tidak valid atau sudah kedaluwarsa.",
					);
				}
			}

			// Successful verification -> navigate to admin dashboard
			navigate({ to: "/admin" });
		} catch (err: any) {
			setError(
				err?.message ||
					"Gagal memverifikasi kode 2FA. Pastikan jam di perangkat Anda sinkron.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col justify-between bg-background text-foreground tech-grid selection:bg-primary/20">
			{/* Top Navbar */}
			<div className="w-full border-b border-border bg-background/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
				<Link
					to="/login"
					className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft size={14} />
					<span>&larr; KEMBALI KE LOGIN</span>
				</Link>
				<div className="flex items-center gap-3">
					<div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
						<ShieldCheck size={14} className="text-emerald-500" />
						<span>2FA // TOTP VERIFICATION</span>
					</div>
					<ThemeToggle />
				</div>
			</div>

			{/* Main Card */}
			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[420px] bg-card border border-border rounded-xl shadow-xl p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in duration-200">
					{/* Header */}
					<div className="flex flex-col items-center text-center gap-2.5">
						<div className="h-12 w-12 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary shadow-xs">
							{useBackupCode ? <KeyRound size={24} /> : <ShieldAlert size={24} />}
						</div>
						<div className="space-y-1">
							<div className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase">
								<span>SARPRAS</span>
								<span>/</span>
								<span className="text-primary font-bold">TWO-FACTOR AUTH</span>
							</div>
							<h1 className="text-xl font-bold tracking-tight text-foreground">
								{useBackupCode ? "Verifikasi Kode Cadangan" : "Verifikasi Authenticator"}
							</h1>
							<p className="text-xs text-muted-foreground leading-relaxed">
								{useBackupCode
									? "Masukkan salah satu kode cadangan darurat (Backup Code) Anda."
									: "Buka aplikasi Google Authenticator / Microsoft Authenticator di ponsel Anda dan masukkan kode 6-digit."}
							</p>
						</div>
					</div>

					{/* Error Box */}
					{error && (
						<div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-start gap-2 font-mono">
							<AlertCircle size={15} className="shrink-0 mt-0.5" />
							<div>
								<span className="font-bold">[VERIFIKASI GAGAL]: </span>
								<span>{error}</span>
							</div>
						</div>
					)}

					{/* Form */}
					<form onSubmit={handleVerify} className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-foreground font-mono">
								{useBackupCode ? "KODE CADANGAN (BACKUP CODE)" : "KODE 6-DIGIT TOTP"}
							</label>
							<input
								type="text"
								inputMode={useBackupCode ? "text" : "numeric"}
								autoComplete="one-time-code"
								autoFocus
								required
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder={useBackupCode ? "XXXX-XXXX-XXXX" : "123 456"}
								maxLength={useBackupCode ? 32 : 8}
								className="px-4 py-3 border border-border rounded-lg text-center text-lg font-mono tracking-widest bg-background focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/40 placeholder:tracking-normal"
							/>
						</div>

						<button
							type="submit"
							disabled={loading || !code.trim()}
							className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs font-mono"
						>
							{loading ? (
								<>
									<svg
										className="animate-spin h-4 w-4 text-current"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>MEMVERIFIKASI...</span>
								</>
							) : (
								<span>VERIFIKASI & MASUK</span>
							)}
						</button>

						<div className="pt-2 border-t border-border flex items-center justify-center">
							<button
								type="button"
								onClick={() => {
									setUseBackupCode(!useBackupCode);
									setCode("");
									setError(null);
								}}
								className="text-xs font-mono text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
							>
								{useBackupCode
									? "Gunakan Kode 6-Digit Authenticator"
									: "Gunakan Kode Cadangan (Backup Code)"}
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Footer */}
			<div className="py-3 text-center text-[11px] font-mono text-muted-foreground border-t border-border bg-background/80">
				&copy; {new Date().getFullYear()} PPKASN KEMENTERIAN SEKRETARIAT NEGARA RI
			</div>
		</div>
	);
}
