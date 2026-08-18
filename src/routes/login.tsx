import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "#/components/ui/theme-toggle";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginComponent,
});

function LoginComponent() {
	const navigate = useNavigate();
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Redirect if already logged in
	useEffect(() => {
		if (session?.user) {
			if ((session.user as any).status === "inactive") {
				setError(
					"Akun Google Anda saat ini berstatus Nonaktif. Hubungi Administrator untuk mengaktifkan kembali.",
				);
			} else {
				navigate({ to: "/admin" });
			}
		}
	}, [session, navigate]);

	const handleGoogleLogin = async () => {
		setLoading(true);
		setError(null);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/admin",
			});
		} catch (err: any) {
			setError(
				err?.message ||
					"Gagal menghubungkan ke akun Google. Pastikan akun Anda terdaftar.",
			);
			setLoading(false);
		}
	};

	if (sessionLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="text-foreground font-mono text-xs animate-pulse">
					[CHECKING AUTHENTICATION SESSION...]
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col justify-between bg-background text-foreground tech-grid selection:bg-primary/20">
			{/* Top Navbar */}
			<div className="w-full border-b border-border bg-background/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
				<Link
					to="/"
					className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft size={14} />
					<span>&larr; BERANDA SARPRAS</span>
				</Link>
				<div className="flex items-center gap-3">
					<div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
						<ShieldCheck size={14} className="text-sky-500" />
						<span>SSO // OAUTH2 PROTECTED</span>
					</div>
					<ThemeToggle />
				</div>
			</div>

			{/* Main Login Card (Aside/Linear style) */}
			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[400px] bg-card border border-border rounded-lg shadow-xl p-6 sm:p-8 flex flex-col gap-6 animate-in fade-in duration-200">
					{/* Logo & Header */}
					<div className="flex flex-col items-center text-center gap-2.5">
						<div className="h-10 w-10 rounded-md border border-primary/30 bg-primary/10 flex items-center justify-center text-primary">
							<Building2 size={20} />
						</div>
						<div className="space-y-1">
							<div className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase">
								<span>PPKASN</span>
								<span>/</span>
								<span className="text-primary font-bold">MANAGEMENT</span>
							</div>
							<h1 className="text-xl font-bold tracking-tight text-foreground">
								Portal Masuk Petugas
							</h1>
							<p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
								Platform Digital Layanan & Fasilitas Kedinasan Terintegrasi PPKASN Kemensetneg
							</p>
						</div>
					</div>

					{/* Error Alert */}
					{error && (
						<div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-start gap-2 font-mono">
							<AlertCircle
								size={15}
								className="shrink-0 mt-0.5"
							/>
							<div>
								<span className="font-bold">[AKSES DITOLAK]: </span>
								<span>{error}</span>
							</div>
						</div>
					)}

					{/* Google SSO Action Button */}
					<div className="flex flex-col gap-3 font-mono text-xs">
						<button
							type="button"
							onClick={handleGoogleLogin}
							disabled={loading}
							className="w-full py-2.5 px-4 bg-background border border-border text-foreground rounded-md text-xs font-semibold hover:bg-muted hover:border-primary/40 focus:outline-hidden disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-2xs"
						>
							{loading ? (
								<>
									<svg
										className="animate-spin h-4 w-4 text-foreground"
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
									<span>MENGHUBUNGKAN KE GOOGLE...</span>
								</>
							) : (
								<>
									<svg className="h-4 w-4" viewBox="0 0 24 24">
										<path
											fill="#4285F4"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="#34A853"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
										<path
											fill="#FBBC05"
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
										/>
										<path
											fill="#EA4335"
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
										/>
									</svg>
									<span>MASUK DENGAN GOOGLE</span>
								</>
							)}
						</button>

						<div className="p-3 bg-muted/40 border border-border/60 rounded-md flex flex-col gap-1 text-[11px] text-muted-foreground">
							<div className="flex items-center gap-1.5 font-semibold text-foreground">
								<ShieldCheck size={13} className="text-sky-500" />
								<span>AKSES KHUSUS OPERATOR & PIMPINAN</span>
							</div>
							<p className="leading-relaxed font-sans text-[11px]">
								Gunakan akun Gmail / Google Workspace yang telah terdaftar di database pengguna administrator.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="py-3 text-center text-[11px] font-mono text-muted-foreground border-t border-border bg-background/80">
				&copy; {new Date().getFullYear()} PPKASN KEMENTERIAN SEKRETARIAT NEGARA RI
			</div>
		</div>
	);
}
