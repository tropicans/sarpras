import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
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
			if (session.user.status === "inactive") {
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
			<div className="flex h-screen items-center justify-center bg-[#fafafa]">
				<div className="text-[#09090b] font-medium text-sm animate-pulse">
					Memeriksa sesi autentikasi...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-[#09090b] selection:bg-blue-100">
			{/* Top Navbar */}
			<div className="w-full border-b border-[#e2e8f0] bg-white px-6 py-4 flex items-center justify-between">
				<Link
					to="/"
					className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors"
				>
					<ArrowLeft size={16} />
					<span>Kembali ke Beranda Sarpras</span>
				</Link>
				<div className="flex items-center gap-2 text-xs font-medium text-[#64748b]">
					<ShieldCheck size={16} className="text-emerald-600" />
					<span>Portal Masuk Resmi PPKASN</span>
				</div>
			</div>

			{/* Main Login Card */}
			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[420px] bg-white border border-[#e2e8f0] rounded-2xl shadow-xl shadow-slate-200/50 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
					{/* Logo & Header */}
					<div className="flex flex-col items-center text-center gap-3">
						<div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
							<Building2 size={28} />
						</div>
						<div className="flex flex-col gap-1">
							<h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
								Masuk Petugas
							</h1>
							<p className="text-xs text-[#64748b] leading-relaxed max-w-xs">
								Sistem Informasi Manajemen Sarana & Prasarana PPKASN Kementerian
								Kesehatan
							</p>
						</div>
					</div>

					{/* Error Alert */}
					{error && (
						<div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
							<AlertCircle
								size={16}
								className="shrink-0 mt-0.5 text-rose-600"
							/>
							<div className="flex flex-col gap-0.5">
								<span className="font-semibold">Akses Ditolak</span>
								<p>{error}</p>
							</div>
						</div>
					)}

					{/* Google SSO Action Button */}
					<div className="flex flex-col gap-3">
						<button
							type="button"
							onClick={handleGoogleLogin}
							disabled={loading}
							className="w-full py-3.5 px-4 bg-white border-2 border-[#e2e8f0] text-[#0f172a] rounded-xl text-sm font-bold hover:bg-[#f8fafc] hover:border-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer transition-all shadow-xs"
						>
							{loading ? (
								<>
									<svg
										className="animate-spin h-5 w-5 text-[#0f172a]"
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
									<span>Menghubungkan ke Google...</span>
								</>
							) : (
								<>
									<svg className="h-5 w-5" viewBox="0 0 24 24">
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
									<span>Masuk dengan Akun Google</span>
								</>
							)}
						</button>

						<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-1 text-[11px] text-[#64748b]">
							<div className="flex items-center gap-1.5 font-semibold text-[#334155]">
								<ShieldCheck size={14} className="text-blue-600" />
								<span>Single Sign-On Terproteksi</span>
							</div>
							<p className="leading-relaxed">
								Hanya akun Gmail / Google Workspace yang telah didaftarkan oleh
								Administrator yang dapat mengakses dashboard manajemen.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="py-4 text-center text-xs text-[#94a3b8] border-t border-[#e2e8f0] bg-white">
				&copy; {new Date().getFullYear()} Pusat Pengembangan Kompetensi Aparatur
				Sipil Negara (PPKASN).
			</div>
		</div>
	);
}
