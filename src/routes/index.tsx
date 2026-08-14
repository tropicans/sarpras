import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BedDouble,
	Building2,
	CalendarCheck,
	CheckCircle2,
	Clock,
	DoorOpen,
	FileText,
	Filter,
	Layers,
	Search,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	AssetCard,
	type PublicAssetItem,
} from "#/components/public/asset-card";
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";
import { ScheduleModal } from "#/components/public/schedule-modal";
import { getPublicAssetsListFn } from "#/lib/booking/public-fns.functions";

export const Route = createFileRoute("/")({
	loader: async () => {
		return await getPublicAssetsListFn();
	},
	component: HomePage,
});

function HomePage() {
	const assets = Route.useLoaderData() as PublicAssetItem[];

	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "room" | "dormitory">(
		"all",
	);
	const [selectedScheduleAsset, setSelectedScheduleAsset] =
		useState<PublicAssetItem | null>(null);

	const filteredAssets = useMemo(() => {
		return assets.filter((asset) => {
			const matchesType =
				typeFilter === "all" ? true : asset.type === typeFilter;
			const matchesSearch =
				asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(asset.location &&
					asset.location.toLowerCase().includes(searchQuery.toLowerCase()));
			return matchesType && matchesSearch;
		});
	}, [assets, searchQuery, typeFilter]);

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
			{/* Public Header */}
			<PublicHeader />

			<main className="flex-1">
				{/* Hero Section */}
				<section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="text-center max-w-3xl mx-auto space-y-6">
							{/* Top Pill */}
							<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs">
								<Sparkles className="h-3.5 w-3.5" />
								<span>Portal Layanan Terpadu Sarpras PPKASN</span>
							</div>

							{/* Hero Heading */}
							<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
								Peminjaman Sarana & Prasarana Menjadi Lebih{" "}
								<span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
									Mudah & Transparan
								</span>
							</h1>

							{/* Subtitle */}
							<p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
								Akses katalog ruangan rapat, aula pelatihan, dan asrama wisma
								PPKASN Kemenkes secara cepat dengan sistem persetujuan terpusat
								dan jadwal terintegrasi.
							</p>

							{/* Hero Actions */}
							<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
								<a
									href="#katalog"
									className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02]"
								>
									<Search className="h-4 w-4" />
									Cari Sarana Sekarang
								</a>
								<Link
									to="/status"
									className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-xs hover:bg-muted transition-all"
								>
									<Clock className="h-4 w-4 text-muted-foreground" />
									Cek Status Permohonan
								</Link>
							</div>

							{/* Trust Badges */}
							<div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									<span>Cek Ketersediaan Real-Time</span>
								</div>
								<div className="flex items-center gap-2">
									<ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									<span>Privasi & Data Terlindungi</span>
								</div>
								<div className="flex items-center gap-2">
									<Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									<span>Fasilitas Lengkap & Terawat</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* 3-Step Guide: Cara Pengajuan */}
				<section className="py-16 sm:py-20 border-b border-border/60 bg-muted/20">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
							<h2 className="text-xs font-bold uppercase tracking-wider text-primary">
								Alur Pelayanan
							</h2>
							<h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								3 Langkah Mudah Peminjaman
							</h3>
							<p className="text-sm text-muted-foreground">
								Proses pengajuan terstruktur dan dapat dipantau setiap saat.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Step 1 */}
							<div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
									1
								</div>
								<div className="space-y-2">
									<h4 className="text-lg font-bold text-foreground">
										Pilih Sarana & Cek Jadwal
									</h4>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Jelajahi katalog ruang rapat atau asrama, dan periksa jadwal
										ketersediaan tanggal melalui kalender publik.
									</p>
								</div>
							</div>

							{/* Step 2 */}
							<div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
									2
								</div>
								<div className="space-y-2">
									<h4 className="text-lg font-bold text-foreground">
										Isi Formulir Permohonan
									</h4>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Lengkapi data identitas pemohon, kontak aktif, tujuan
										kegiatan, dan perkiraan jumlah peserta dalam 3 tahap
										singkat.
									</p>
								</div>
							</div>

							{/* Step 3 */}
							<div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
									3
								</div>
								<div className="space-y-2">
									<h4 className="text-lg font-bold text-foreground">
										Pantau Status Persetujuan
									</h4>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Simpan ID permohonan dan pantau proses verifikasi oleh
										petugas secara transparan melalui halaman status.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Asset Catalog Section */}
				<section id="katalog" className="py-16 sm:py-24">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
						<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
							<div className="space-y-1">
								<h2 className="text-xs font-bold uppercase tracking-wider text-primary">
									Katalog Sarana
								</h2>
								<h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
									Pilihan Ruangan & Asrama
								</h3>
								<p className="text-sm text-muted-foreground">
									Daftar sarana aktif yang siap digunakan untuk berbagai
									keperluan kegiatan.
								</p>
							</div>

							{/* Search & Filter Bar */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
								<div className="relative">
									<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Cari nama atau lokasi sarana..."
										className="w-full sm:w-64 rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
									/>
								</div>

								{/* Category Filter Pills */}
								<div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
									<button
										type="button"
										onClick={() => setTypeFilter("all")}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
											typeFilter === "all"
												? "bg-card text-foreground shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										Semua ({assets.length})
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("room")}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
											typeFilter === "room"
												? "bg-card text-foreground shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										Ruangan
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("dormitory")}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
											typeFilter === "dormitory"
												? "bg-card text-foreground shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										Asrama
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("vehicle")}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
											typeFilter === "vehicle"
												? "bg-card text-foreground shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										Kendaraan
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("field")}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
											typeFilter === "field"
												? "bg-card text-foreground shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										Lapangan
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("equipment")}
										className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
											typeFilter === "equipment"
												? "bg-card text-foreground shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										Peralatan
									</button>
								</div>
							</div>
						</div>

						{/* Catalog Grid */}
						{filteredAssets.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
								<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
									<Filter className="h-6 w-6" />
								</div>
								<h4 className="font-bold text-base text-foreground">
									Tidak Ada Sarana Ditemukan
								</h4>
								<p className="text-sm text-muted-foreground max-w-sm mx-auto">
									Coba sesuaikan kata kunci pencarian atau pilih filter kategori
									lain.
								</p>
								<button
									type="button"
									onClick={() => {
										setSearchQuery("");
										setTypeFilter("all");
									}}
									className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-2"
								>
									Reset Pencarian
								</button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredAssets.map((asset) => (
									<AssetCard
										key={asset.id}
										asset={asset}
										onViewSchedule={(item) => setSelectedScheduleAsset(item)}
									/>
								))}
							</div>
						)}
					</div>
				</section>
			</main>

			{/* Schedule Modal */}
			<ScheduleModal
				asset={selectedScheduleAsset}
				isOpen={selectedScheduleAsset !== null}
				onClose={() => setSelectedScheduleAsset(null)}
			/>

			{/* Public Footer */}
			<PublicFooter />
		</div>
	);
}
