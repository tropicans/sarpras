import {
	Building2,
	Clock,
	Heart,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
} from "lucide-react";

export function PublicFooter() {
	return (
		<footer className="border-t border-border bg-card/50 text-foreground transition-colors">
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Institution Branding */}
					<div className="md:col-span-2 space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
								<Building2 className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-bold text-base leading-tight">
									Pusat Pengembangan Kompetensi ASN
								</h3>
								<p className="text-xs text-muted-foreground">
									Kementerian Kesehatan Republik Indonesia
								</p>
							</div>
						</div>
						<p className="text-sm text-muted-foreground max-w-md leading-relaxed">
							Sistem Informasi Manajemen Peminjaman Sarana dan Prasarana terpadu
							untuk mendukung kelancaran kegiatan kedinasan, pelatihan, dan
							kegiatan strategis aparatur sipil negara.
						</p>
						<div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
							<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							<span>Akuntabel, Transparan, dan Terintegrasi</span>
						</div>
					</div>

					{/* Operating Info */}
					<div className="space-y-3">
						<h4 className="font-semibold text-sm text-foreground">
							Jam Layanan Kantor
						</h4>
						<ul className="space-y-2.5 text-sm text-muted-foreground">
							<li className="flex items-start gap-2">
								<Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
								<div>
									<p className="font-medium text-foreground">Senin - Jumat</p>
									<p className="text-xs">08:00 - 16:00 WIB</p>
								</div>
							</li>
							<li className="flex items-start gap-2">
								<Clock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
								<div>
									<p className="font-medium text-foreground">
										Sabtu, Minggu & Hari Libur
									</p>
									<p className="text-xs">
										Sesuai permohonan & persetujuan khusus
									</p>
								</div>
							</li>
						</ul>
					</div>

					{/* Contact & Location */}
					<div className="space-y-3">
						<h4 className="font-semibold text-sm text-foreground">
							Kontak & Lokasi
						</h4>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li className="flex items-start gap-2">
								<MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
								<span className="text-xs leading-relaxed">
									Jl. Hang Jebat III Blok F3, Kebayoran Baru, Jakarta Selatan,
									DKI Jakarta 12120
								</span>
							</li>
							<li className="flex items-center gap-2">
								<Phone className="h-4 w-4 shrink-0 text-primary" />
								<span className="text-xs">(021) 724-4409</span>
							</li>
							<li className="flex items-center gap-2">
								<Mail className="h-4 w-4 shrink-0 text-primary" />
								<span className="text-xs">ppkasn@kemkes.go.id</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} PPKASN Kemenkes RI. Hak Cipta
						Dilindungi Undang-Undang.
					</p>
					<div className="flex items-center gap-4">
						<a
							href="/#katalog"
							className="hover:text-foreground transition-colors"
						>
							Katalog
						</a>
						<a href="/status" className="hover:text-foreground transition-colors">
							Status
						</a>
						<a href="/login" className="hover:text-foreground transition-colors">
							Petugas
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
