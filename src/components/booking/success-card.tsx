import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	Home,
	Info,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";

interface SuccessCardProps {
	bookingId: string;
	assetName: string;
}

export function SuccessCard({ bookingId, assetName }: SuccessCardProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(bookingId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	};

	return (
		<div className="max-w-2xl mx-auto rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-lg text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
			{/* Top Success Icon */}
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
				<CheckCircle2 className="h-10 w-10" />
			</div>

			{/* Title & Description */}
			<div className="space-y-2">
				<h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					Permohonan Berhasil Dikirim!
				</h2>
				<p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
					Pengajuan peminjaman untuk <strong>{assetName}</strong> telah diterima
					sistem dan sedang dalam antrean verifikasi petugas operator.
				</p>
			</div>

			{/* Reference Code Box */}
			<div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Kode Referensi / ID Permohonan
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<span className="font-mono text-xl sm:text-2xl font-black text-primary tracking-wider break-all">
						{bookingId}
					</span>
					<button
						type="button"
						onClick={handleCopy}
						className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted transition-all cursor-pointer shrink-0"
					>
						{copied ? (
							<>
								<Check className="h-3.5 w-3.5 text-emerald-600" />
								<span className="text-emerald-600 font-bold">Tersalin!</span>
							</>
						) : (
							<>
								<Copy className="h-3.5 w-3.5 text-muted-foreground" />
								<span>Salin Kode</span>
							</>
						)}
					</button>
				</div>
				<p className="text-[11px] text-muted-foreground">
					Simpan kode ini untuk memeriksa status persetujuan atau melakukan
					pembatalan sewaktu-waktu.
				</p>
			</div>

			{/* Status Hint */}
			<div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
				<Clock className="h-4 w-4 text-primary shrink-0" />
				<span>
					Proses verifikasi oleh petugas umumnya memerlukan waktu 1x24 jam kerja.
				</span>
			</div>

			{/* Action CTA Buttons */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
				<Link
					to={`/status/${bookingId}`}
					className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
				>
					<Search className="h-4 w-4" />
					Pantau Status Permohonan
				</Link>
				<Link
					to="/"
					className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
				>
					<Home className="h-4 w-4 text-muted-foreground" />
					Kembali ke Beranda
				</Link>
			</div>
		</div>
	);
}
