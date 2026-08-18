import { Link } from "@tanstack/react-router";
import {
	Check,
	CheckCircle2,
	Copy,
	Home,
	Search,
} from "lucide-react";
import { useState } from "react";

interface SuccessCardProps {
	bookingId: string;
	assetName?: string;
	onReset?: () => void;
}

export function SuccessCard({ bookingId, assetName }: SuccessCardProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(bookingId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="rounded-xl border border-emerald-500/30 bg-card p-6 sm:p-8 space-y-6 text-center shadow-sm">
			{/* Icon and status badge */}
			<div className="flex flex-col items-center justify-center gap-3">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<CheckCircle2 className="h-8 w-8" />
				</div>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
					STATUS // PERMOHONAN BERHASIL DIAJUKAN
				</span>
			</div>

			{/* Main text */}
			<div className="space-y-2 max-w-lg mx-auto">
				<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
					Permohonan Peminjaman Diterima
				</h2>
				{assetName && (
					<div className="text-xs font-mono text-muted-foreground bg-muted/40 py-1.5 px-3 rounded-md inline-block border border-border">
						Fasilitas: <strong className="text-foreground">{assetName}</strong>
					</div>
				)}
				<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					Pengajuan peminjaman fasilitas Anda telah tercatat dalam sistem dan
					sedang menunggu peninjauan oleh administrator. Notifikasi update akan
					dikirimkan melalui Email & WhatsApp yang terdaftar.
				</p>
			</div>

			{/* Booking reference code display */}
			<div className="mx-auto max-w-md rounded-lg border border-border bg-muted/40 p-4 space-y-2 font-mono">
				<div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					KODE REFERENSI TIKET (REF ID)
				</div>
				<div className="flex items-center justify-between gap-2 rounded bg-background px-3 py-2 border border-border">
					<code className="text-xs sm:text-sm font-bold text-primary select-all break-all">
						{bookingId}
					</code>
					<button
						type="button"
						onClick={handleCopy}
						className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-sans transition-colors cursor-pointer shrink-0"
						title="Salin Kode"
					>
						{copied ? (
							<>
								<Check className="h-3.5 w-3.5 text-emerald-500" />
								<span className="text-emerald-600 font-semibold">Tersalin</span>
							</>
						) : (
							<>
								<Copy className="h-3.5 w-3.5" />
								<span>Salin</span>
							</>
						)}
					</button>
				</div>
				<p className="text-[10px] text-muted-foreground">
					Simpan kode ini untuk mengecek status permohonan atau melakukan pembatalan.
				</p>
			</div>

			{/* Action CTA Buttons */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 font-mono text-xs">
				<Link
					to="/status/$ref"
					params={{ ref: bookingId }}
					className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-2xs"
				>
					<Search className="h-3.5 w-3.5" />
					<span>[PANTAU STATUS TIKET]</span>
				</Link>
				<Link
					to="/"
					className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
				>
					<Home className="h-3.5 w-3.5 text-muted-foreground" />
					<span>KEMBALI KE BERANDA</span>
				</Link>
			</div>
		</div>
	);
}
