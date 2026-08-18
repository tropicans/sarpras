import {
	Calendar,
	Cpu,
	Mail,
	MessageSquare,
	Mic,
	QrCode,
	ShieldCheck,
	Sparkles,
	Tv,
	Video,
	Wifi,
	Zap,
} from "lucide-react";

export function BentoShowcase() {
	return (
		<section className="relative border-b border-border/80 bg-muted/20 py-16 sm:py-20 overflow-hidden">
			{/* Subtle background radial glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
				{/* Section Header */}
				<div className="text-center max-w-2xl mx-auto space-y-2">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] text-muted-foreground shadow-2xs">
						<Sparkles className="h-3.5 w-3.5 text-primary" />
						<span className="font-semibold text-foreground">ARSITEKTUR & FITUR UNGGULAN</span>
					</div>
					<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
						Standar Digitalisasi Fasilitas Terpadu
					</h2>
					<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
						Infrastruktur peminjaman sarana PPKASN Kemensetneg dengan kendali jadwal real-time, verifikasi keamanan digital, dan notifikasi instan.
					</p>
				</div>

				{/* Bento Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
					{/* Bento 1: Conflict-Free Scheduler (2 cols wide) */}
					<div className="group relative md:col-span-2 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-center justify-between border-b border-border/60 pb-3">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
									<Calendar className="h-4 w-4" />
								</div>
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
									01 // SCHEDULING ENGINE
								</span>
							</div>
							<span className="font-mono text-[10px] rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
								ANTI-OVERLAP 100%
							</span>
						</div>

						<div className="mt-4 space-y-4">
							<div>
								<h3 className="text-base sm:text-lg font-bold text-foreground">
									Validasi Jadwal Real-Time Bebas Bentrok
								</h3>
								<p className="text-xs text-muted-foreground mt-1 max-w-xl">
									Setiap pengajuan divalidasi langsung terhadap kalender terpusat. Mengeliminasi tumpang tindih waktu antar unit kerja secara otomatis.
								</p>
							</div>

							{/* Visual Diagram: Live Timeline Matrix */}
							<div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 space-y-2.5 font-mono text-xs">
								<div className="flex items-center justify-between text-[11px] text-muted-foreground">
									<span>Timeline Audit Hari Ini</span>
									<span className="text-emerald-600 dark:text-emerald-400 font-medium">● 3 Sesi Terkonfirmasi</span>
								</div>

								{/* Timeline visual bars */}
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<span className="w-20 text-[10px] text-muted-foreground truncate">Auditorium</span>
										<div className="flex-1 flex gap-1 h-6 bg-card rounded border border-border/70 p-0.5">
											<div className="w-1/3 bg-sky-500/20 text-sky-700 dark:text-sky-300 rounded text-[9px] flex items-center justify-center font-bold border border-sky-500/30">
												08:00 - 11:30 (Rapat Utama)
											</div>
											<div className="flex-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] flex items-center justify-center font-semibold border border-emerald-500/20">
												Slot Siap Pakai
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<span className="w-20 text-[10px] text-muted-foreground truncate">Ruang Garuda</span>
										<div className="flex-1 flex gap-1 h-6 bg-card rounded border border-border/70 p-0.5">
											<div className="w-1/2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] flex items-center justify-center font-semibold border border-emerald-500/20">
												Tersedia Pagi
											</div>
											<div className="w-1/2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-[9px] flex items-center justify-center font-bold border border-indigo-500/30">
												13:00 - 16:30 (Pelatihan)
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Bento 2: Digital Ticket & QR Check */}
					<div className="group relative rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-center justify-between border-b border-border/60 pb-3">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
									<QrCode className="h-4 w-4" />
								</div>
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
									02 // TIKET RESMI
								</span>
							</div>
							<ShieldCheck className="h-4 w-4 text-sky-500" />
						</div>

						<div className="mt-4 space-y-4">
							<div>
								<h3 className="text-base font-bold text-foreground">
									E-Tiket & Verifikasi QR
								</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Tiket digital berenkripsi dengan kode referensi unik untuk izin akses pengamanan gedung dan teknisi.
								</p>
							</div>

							{/* Ticket Mockup Card */}
							<div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 space-y-2">
								<div className="flex items-center justify-between">
									<span className="font-mono text-[10px] text-muted-foreground font-semibold">
										PASS-2026-PPKASN
									</span>
									<span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
										VALID
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="rounded bg-white p-1 shadow-2xs border border-border">
										<QrCode className="h-8 w-8 text-slate-950" />
									</div>
									<div className="text-[11px] space-y-0.5">
										<p className="font-semibold text-foreground">Ruang Rapat Utama</p>
										<p className="text-[10px] text-muted-foreground">Otorisasi Satpam & Teknisi</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Bento 3: Multi-Channel Dispatch */}
					<div className="group relative rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-center justify-between border-b border-border/60 pb-3">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
									<Zap className="h-4 w-4" />
								</div>
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
									03 // ALERT OTOMATIS
								</span>
							</div>
							<span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
						</div>

						<div className="mt-4 space-y-4">
							<div>
								<h3 className="text-base font-bold text-foreground">
									WhatsApp & Email Real-time
								</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Notifikasi instan dikirim ke pemohon saat pengajuan disetujui, direvisi, atau dibatalkan.
								</p>
							</div>

							<div className="space-y-2 font-mono text-[11px]">
								<div className="flex items-center gap-2 rounded border border-border bg-muted/40 p-2 text-foreground">
									<MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
									<span className="truncate">WA: "Status Booking #BK-91 telah disetujui"</span>
								</div>
								<div className="flex items-center gap-2 rounded border border-border bg-muted/40 p-2 text-foreground">
									<Mail className="h-3.5 w-3.5 text-sky-500 shrink-0" />
									<span className="truncate">Email: Lampiran E-Tiket & Tata Tertib</span>
								</div>
							</div>
						</div>
					</div>

					{/* Bento 4: Hybrid & AV Specs (2 cols wide) */}
					<div className="group relative md:col-span-2 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-center justify-between border-b border-border/60 pb-3">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
									<Video className="h-4 w-4" />
								</div>
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
									04 // FASILITAS HYBRID LENGKAP
								</span>
							</div>
							<span className="font-mono text-[10px] text-muted-foreground">
								READY FOR HIGH-LEVEL MEETINGS
							</span>
						</div>

						<div className="mt-4 space-y-4">
							<div>
								<h3 className="text-base sm:text-lg font-bold text-foreground">
									Kesiapan Audio Visual & Fasilitas Terstandar
								</h3>
								<p className="text-xs text-muted-foreground mt-1 max-w-xl">
									Setiap ruangan dirancang untuk mendukung rapat hybrid Zoom/Teams dengan dukungan teknisi sarana yang bersiap di lokasi.
								</p>
							</div>

							{/* Spec Grid Pills */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
								<div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
									<div className="flex items-center gap-1.5 text-sky-500">
										<Tv className="h-3.5 w-3.5" />
										<span className="font-mono text-[11px] font-bold">Display 4K UHD</span>
									</div>
									<p className="text-[10px] text-muted-foreground font-sans">
										Videowall & Proyektor Laser
									</p>
								</div>

								<div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
									<div className="flex items-center gap-1.5 text-indigo-500">
										<Mic className="h-3.5 w-3.5" />
										<span className="font-mono text-[11px] font-bold">Audio Multi-Mic</span>
									</div>
									<p className="text-[10px] text-muted-foreground font-sans">
										Mic Wireless & Ceiling Array
									</p>
								</div>

								<div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
									<div className="flex items-center gap-1.5 text-emerald-500">
										<Wifi className="h-3.5 w-3.5" />
										<span className="font-mono text-[11px] font-bold">Wi-Fi 6 Highspeed</span>
									</div>
									<p className="text-[10px] text-muted-foreground font-sans">
										Dedicated Bandwidth Kemensetneg
									</p>
								</div>

								<div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
									<div className="flex items-center gap-1.5 text-amber-500">
										<Cpu className="h-3.5 w-3.5" />
										<span className="font-mono text-[11px] font-bold">Genset Backup</span>
									</div>
									<p className="text-[10px] text-muted-foreground font-sans">
										Daya Listrik Tanpa Terputus
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
