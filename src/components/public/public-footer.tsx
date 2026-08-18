import {
	Building2,
	Clock,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	Terminal,
} from "lucide-react";

export function PublicFooter() {
	return (
		<footer className="border-t border-border bg-background text-foreground transition-colors">
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Institution Branding */}
					<div className="md:col-span-2 space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
								<Building2 className="h-4 w-4" />
							</div>
							<div>
								<h3 className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">
									PPKASN Kemensetneg RI
								</h3>
								<p className="text-[11px] text-muted-foreground">
									Platform Digital Layanan & Fasilitas Kedinasan Terintegrasi
								</p>
							</div>
						</div>
						<p className="text-xs text-muted-foreground max-w-md leading-relaxed">
							Infrastruktur pengelolaan sarana kedinasan, aula representatif,
							ruang rapat hybrid, dan fasilitas asrama wisma aparatur sipil
							negara.
						</p>
						<div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground pt-1">
							<div className="flex items-center gap-1.5">
								<ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
								<span>SECURE // AUDITED</span>
							</div>
							<span>•</span>
							<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
								<span>LIVE SYNC ACTIVE</span>
							</div>
						</div>
					</div>

					{/* Operating Info */}
					<div className="space-y-2.5">
						<h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
							Layanan Operasional
						</h4>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li className="flex items-start gap-2">
								<Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
								<div>
									<p className="font-medium text-foreground">Senin - Jumat</p>
									<p className="text-[11px] font-mono">08:00 - 15:00 WIB</p>
								</div>
							</li>
							<li className="flex items-start gap-2">
								<Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
								<div>
									<p className="font-medium text-foreground">Weekend & Libur</p>
									<p className="text-[11px] text-muted-foreground">
										Persetujuan khusus pimpinan
									</p>
								</div>
							</li>
						</ul>
					</div>

					{/* Contact & Location */}
					<div className="space-y-2.5">
						<h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
							Kontak Sekretariat
						</h4>
						<ul className="space-y-1.5 text-xs text-muted-foreground">
							<li className="flex items-start gap-2">
								<MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
								<span className="text-[11px] leading-relaxed">
									Jalan Gaharu I Nomor 1, Cipete Selatan, Jakarta Selatan 12430
								</span>
							</li>
							<li className="flex items-center gap-2">
								<Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
								<span className="font-mono text-[11px]">(021) 7664009</span>
							</li>
							<li className="flex items-center gap-2">
								<Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
								<span className="font-mono text-[11px]">
									ppkasn@setneg.go.id
								</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-muted-foreground">
					<div className="flex items-center gap-2">
						<Terminal className="h-3.5 w-3.5 text-primary" />
						<span>SARPRAS-PPKASN v1.0</span>
						<span className="text-border">•</span>
						<span>
							&copy; {new Date().getFullYear()} KEMENTERIAN SEKRETARIAT NEGARA
							RI
						</span>
					</div>
					<div className="flex items-center gap-3">
						<a
							href="/#katalog"
							className="hover:text-primary transition-colors"
						>
							KATALOG
						</a>
						<span className="text-border">/</span>
						<a href="/status" className="hover:text-primary transition-colors">
							STATUS
						</a>
						<span className="text-border">/</span>
						<a href="/login" className="hover:text-primary transition-colors">
							PORTAL PETUGAS
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
