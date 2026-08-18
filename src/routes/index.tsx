import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	BedDouble,
	Calendar,
	CalendarCheck,
	CheckCircle2,
	Clock,
	DoorOpen,
	FileText,
	Filter,
	Loader2,
	RotateCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Terminal,
	XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	AssetCard,
	type AssetAvailabilityStatus,
	type PublicAssetItem,
} from "#/components/public/asset-card";
import { BentoShowcase } from "#/components/public/bento-showcase";
import { HeroConsole } from "#/components/public/hero-console";
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";
import { ScheduleModal } from "#/components/public/schedule-modal";
import {
	checkCatalogAvailabilityFn,
	getPublicAssetsListFn,
} from "#/lib/booking/public-fns.functions";

export const Route = createFileRoute("/")({
	loader: async () => {
		return await getPublicAssetsListFn();
	},
	component: HomePage,
});

function HomePage() {
	const assets = Route.useLoaderData() as PublicAssetItem[];

	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [selectedScheduleAsset, setSelectedScheduleAsset] =
		useState<PublicAssetItem | null>(null);

	// Date & Time Availability Filter state
	const [filterDate, setFilterDate] = useState<string>("");
	const [filterStartTime, setFilterStartTime] = useState<string>("08:00");
	const [filterEndTime, setFilterEndTime] = useState<string>("17:00");
	const [availableOnly, setAvailableOnly] = useState<boolean>(false);
	const [isCheckingAvailability, setIsCheckingAvailability] =
		useState<boolean>(false);
	const [availabilityMap, setAvailabilityMap] = useState<
		Record<string, AssetAvailabilityStatus>
	>({});

	// Real-time batch catalog availability calculation
	useEffect(() => {
		if (!filterDate || !filterStartTime || !filterEndTime) {
			setAvailabilityMap({});
			setIsCheckingAvailability(false);
			return;
		}

		let isCancelled = false;

		const runCheck = async () => {
			const startIso = new Date(
				`${filterDate}T${filterStartTime}:00+07:00`,
			).toISOString();
			const endIso = new Date(
				`${filterDate}T${filterEndTime}:00+07:00`,
			).toISOString();

			if (new Date(startIso) >= new Date(endIso)) {
				return;
			}

			setIsCheckingAvailability(true);
			try {
				const results = await checkCatalogAvailabilityFn({
					data: {
						startDate: startIso,
						endDate: endIso,
					},
				});
				if (!isCancelled) {
					setAvailabilityMap(results as Record<string, AssetAvailabilityStatus>);
					setIsCheckingAvailability(false);
				}
			} catch (err) {
				if (!isCancelled) {
					setIsCheckingAvailability(false);
				}
			}
		};

		const timer = setTimeout(runCheck, 250);
		return () => {
			isCancelled = true;
			clearTimeout(timer);
		};
	}, [filterDate, filterStartTime, filterEndTime]);

	// Quick date helpers
	const handleSetToday = () => {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, "0");
		setFilterDate(
			`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
		);
	};

	const handleSetTomorrow = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const pad = (n: number) => String(n).padStart(2, "0");
		setFilterDate(
			`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`,
		);
	};

	const handleResetDateFilter = () => {
		setFilterDate("");
		setFilterStartTime("08:00");
		setFilterEndTime("17:00");
		setAvailableOnly(false);
		setAvailabilityMap({});
	};

	// Count statistics for the facilities console
	const stats = useMemo(() => {
		const roomCount = assets.filter((a) => a.type === "room").length;
		const dormCount = assets.filter((a) => a.type === "dormitory").length;
		const vehicleCount = assets.filter((a) => a.type === "vehicle").length;
		const otherCount = assets.length - (roomCount + dormCount + vehicleCount);
		return { roomCount, dormCount, vehicleCount, otherCount, total: assets.length };
	}, [assets]);

	const filteredAssets = useMemo(() => {
		return assets.filter((asset) => {
			const matchesType =
				typeFilter === "all" ? true : asset.type === typeFilter;
			const matchesSearch =
				asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(asset.location &&
					asset.location.toLowerCase().includes(searchQuery.toLowerCase()));

			if (filterDate && availableOnly) {
				const status = availabilityMap[asset.id];
				if (status && status.available === false) {
					return false;
				}
			}

			return matchesType && matchesSearch;
		});
	}, [
		assets,
		searchQuery,
		typeFilter,
		filterDate,
		availableOnly,
		availabilityMap,
	]);

	const availabilityStats = useMemo(() => {
		if (!filterDate) return null;
		let availableCount = 0;
		let occupiedCount = 0;
		for (const asset of assets) {
			const status = availabilityMap[asset.id];
			if (status) {
				if (status.available) availableCount++;
				else occupiedCount++;
			}
		}
		return { availableCount, occupiedCount, total: assets.length };
	}, [assets, filterDate, availabilityMap]);

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
			{/* Public Header */}
			<PublicHeader />

			<main className="flex-1">
				{/* Hero: Facility System Console (TanStack & DevTools Style Split View) */}
				<section className="relative border-b border-border tech-grid bg-card/20 py-12 sm:py-20 overflow-hidden">
					{/* Radial Ambient Mesh Glow */}
					<div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
					<div className="absolute top-1/3 right-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

					<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
							{/* Left Column: Headlines & Call to Action */}
							<div className="lg:col-span-6 space-y-6">
								{/* Technical Status Pill */}
								<div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 py-1 font-mono text-[11px] text-muted-foreground shadow-2xs backdrop-blur-md">
									<Terminal className="h-3.5 w-3.5 text-primary" />
									<span className="text-foreground font-semibold">PPKASN // SARPRAS</span>
									<span className="text-border">|</span>
									<span className="text-sky-600 dark:text-sky-400 font-medium">PORTAL v1.0</span>
								</div>

								{/* High-Impact Headline */}
								<div className="space-y-3">
									<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
										Sistem Fasilitas Kedinasan Terpadu{" "}
										<span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
											PPKASN Kemensetneg
										</span>
									</h1>
									<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
										Katalog & reservasi resmi ruang rapat berstandar tinggi, asrama wisma kedinasan, aula pelatihan, dan armada kendaraan dengan sinkronisasi jadwal real-time.
									</p>
								</div>

								{/* Feature Checkpoints */}
								<div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
									<div className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
										<span>Validasi Anti-Bentrok</span>
									</div>
									<div className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
										<span>E-Tiket & QR Resmi</span>
									</div>
									<div className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
										<span>Notifikasi WA & Email</span>
									</div>
									<div className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
										<span>Persetujuan 24-48 Jam</span>
									</div>
								</div>

								{/* Actions Bar */}
								<div className="flex flex-wrap items-center gap-3 pt-2">
									<a
										href="#katalog"
										className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-md hover:shadow-primary/20 cursor-pointer"
									>
										<Search className="h-3.5 w-3.5" />
										<span>Jelajahi Katalog ({assets.length} Sarana)</span>
									</a>
									<Link
										to="/status"
										className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted shadow-2xs"
									>
										<Clock className="h-3.5 w-3.5 text-muted-foreground" />
										<span>Cek Status Tiket</span>
									</Link>
								</div>
							</div>

							{/* Right Column: Live Interactive TanStack-Grade Console Mockup */}
							<div className="lg:col-span-6">
								<HeroConsole />
							</div>
						</div>

						{/* Live System Metrics Ribbon */}
						<div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/80 pt-6">
							<div className="rounded-lg border border-border bg-card p-3.5 font-mono shadow-2xs">
								<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase">
									<span>Ruang Rapat</span>
									<DoorOpen className="h-3.5 w-3.5 text-sky-500" />
								</div>
								<div className="mt-1.5 flex items-baseline gap-2">
									<span className="text-2xl font-bold tracking-tight text-foreground">
										{stats.roomCount}
									</span>
									<span className="text-[10px] text-muted-foreground">Unit Aktif</span>
								</div>
							</div>

							<div className="rounded-lg border border-border bg-card p-3.5 font-mono shadow-2xs">
								<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase">
									<span>Asrama / Wisma</span>
									<BedDouble className="h-3.5 w-3.5 text-indigo-500" />
								</div>
								<div className="mt-1.5 flex items-baseline gap-2">
									<span className="text-2xl font-bold tracking-tight text-foreground">
										{stats.dormCount}
									</span>
									<span className="text-[10px] text-muted-foreground">Kamar/Wisma</span>
								</div>
							</div>

							<div className="rounded-lg border border-border bg-card p-3.5 font-mono shadow-2xs">
								<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase">
									<span>Kendaraan & Alat</span>
									<Activity className="h-3.5 w-3.5 text-emerald-500" />
								</div>
								<div className="mt-1.5 flex items-baseline gap-2">
									<span className="text-2xl font-bold tracking-tight text-foreground">
										{stats.vehicleCount + stats.otherCount}
									</span>
									<span className="text-[10px] text-muted-foreground">Armada/Item</span>
								</div>
							</div>

							<div className="rounded-lg border border-border bg-card p-3.5 font-mono shadow-2xs">
								<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase">
									<span>SLA Verifikasi</span>
									<ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
								</div>
								<div className="mt-1.5 flex items-baseline gap-2">
									<span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
										24-48h
									</span>
									<span className="text-[10px] text-muted-foreground">Waktu Respon</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Bento Grid Visual Feature Showcase */}
				<BentoShowcase />

				{/* 3-Stage Process Pipeline */}
				<section id="panduan" className="border-b border-border bg-card/40 py-14">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="mb-8 space-y-1">
							<span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
								PIPELINE // PROSES PENGAJUAN
							</span>
							<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
								Alur Peminjaman Fasilitas Kedinasan
							</h2>
							<p className="text-xs text-muted-foreground">
								Tahapan pengajuan transparan dengan pembaruan status real-time via WhatsApp & Email.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Step 1 */}
							<div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-2xs">
								<div className="flex items-center justify-between border-b border-border/60 pb-2.5">
									<span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
										01 // PILIH & CEK
									</span>
									<CalendarCheck className="h-4 w-4 text-sky-500" />
								</div>
								<h3 className="text-sm font-bold text-foreground">
									Pilih Sarana & Periksa Kalender
								</h3>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Telusuri katalog fasilitas, pilih waktu kegiatan, dan pastikan tanggal belum terisi peminjam lain.
								</p>
							</div>

							{/* Step 2 */}
							<div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-2xs">
								<div className="flex items-center justify-between border-b border-border/60 pb-2.5">
									<span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
										02 // SUBMIT FORM
									</span>
									<FileText className="h-4 w-4 text-indigo-500" />
								</div>
								<h3 className="text-sm font-bold text-foreground">
									Lengkapi Formulir Pengajuan
								</h3>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Lengkapi identitas penanggung jawab, instansi pemohon, agenda kegiatan, dan kontak WhatsApp aktif.
								</p>
							</div>

							{/* Step 3 */}
							<div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-2xs">
								<div className="flex items-center justify-between border-b border-border/60 pb-2.5">
									<span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
										03 // TIKET & TRACKING
									</span>
									<CheckCircle2 className="h-4 w-4 text-emerald-500" />
								</div>
								<h3 className="text-sm font-bold text-foreground">
									Dapatkan Kode Tiket & Notifikasi
								</h3>
								<p className="text-xs text-muted-foreground leading-relaxed">
									Gunakan kode referensi booking untuk memantau proses verifikasi operator dan persetujuan pimpinan.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Asset Catalog Section (TanStack DevTools Filter & Grid) */}
				<section id="katalog" className="py-14 sm:py-18">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
						<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-5">
							<div className="space-y-1">
								<span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
									REGISTRY // FASILITAS TERVERIFIKASI
								</span>
								<h2 className="text-2xl font-bold tracking-tight text-foreground">
									Katalog Sarana & Prasarana
								</h2>
								<p className="text-xs text-muted-foreground">
									Daftar aset aktif yang terdaftar dalam inventaris PPKASN Kemensetneg RI.
								</p>
							</div>

							{/* Search & Filter Toolbar */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
								{/* Search Input */}
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Cari sarana / lokasi..."
										className="w-full sm:w-56 rounded-md border border-border bg-card pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
									/>
								</div>

								{/* Segmented Filter Pills */}
								<div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5 font-mono text-[11px]">
									<button
										type="button"
										onClick={() => setTypeFilter("all")}
										className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
											typeFilter === "all"
												? "bg-card text-foreground font-semibold shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										ALL ({assets.length})
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("room")}
										className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
											typeFilter === "room"
												? "bg-card text-foreground font-semibold shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										ROOM
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("dormitory")}
										className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
											typeFilter === "dormitory"
												? "bg-card text-foreground font-semibold shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										ASRAMA
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("field")}
										className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
											typeFilter === "field"
												? "bg-card text-foreground font-semibold shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										LAPANGAN
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("vehicle")}
										className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
											typeFilter === "vehicle"
												? "bg-card text-foreground font-semibold shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										MOBIL
									</button>
									<button
										type="button"
										onClick={() => setTypeFilter("equipment")}
										className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
											typeFilter === "equipment"
												? "bg-card text-foreground font-semibold shadow-2xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										ALAT
									</button>
								</div>
							</div>
						</div>

						{/* Interactive Real-Time Date & Time Availability Filter Console */}
						<div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4 font-mono text-xs">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
								<div className="flex items-center gap-2.5">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
										<Calendar className="h-4 w-4" />
									</div>
									<div>
										<h3 className="font-bold text-foreground text-xs uppercase tracking-wide flex items-center gap-2">
											<span>CEK KETERSEDIAAN JADWAL REAL-TIME</span>
											{isCheckingAvailability && (
												<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
											)}
										</h3>
										<p className="text-[11px] text-muted-foreground font-sans">
											Pilih tanggal & jam untuk melihat langsung ruangan mana yang kosong dan siap dipinjam.
										</p>
									</div>
								</div>

								{filterDate && (
									<div className="flex items-center gap-2 self-start sm:self-auto">
										<button
											type="button"
											onClick={handleResetDateFilter}
											className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/60 bg-muted/40 px-2.5 py-1 rounded"
										>
											<RotateCcw className="h-3 w-3" />
											<span>Reset Tanggal</span>
										</button>
									</div>
								)}
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
								{/* Date input + quick buttons */}
								<div className="lg:col-span-4 space-y-1.5">
									<div className="flex items-center justify-between">
										<label className="font-semibold text-foreground text-[11px] uppercase flex items-center gap-1.5">
											<Calendar className="h-3 w-3 text-primary" />
											Tanggal Acara
										</label>
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={handleSetToday}
												className="text-[10px] bg-secondary px-2 py-0.5 rounded text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
											>
												Hari Ini
											</button>
											<button
												type="button"
												onClick={handleSetTomorrow}
												className="text-[10px] bg-secondary px-2 py-0.5 rounded text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
											>
												Besok
											</button>
										</div>
									</div>
									<input
										type="date"
										value={filterDate}
										onChange={(e) => setFilterDate(e.target.value)}
										onClick={(e) => {
											try {
												e.currentTarget.showPicker?.();
											} catch {}
										}}
										className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-mono cursor-pointer"
									/>
								</div>

								{/* Time Start & End */}
								<div className="lg:col-span-4 space-y-1.5">
									<div className="flex items-center justify-between">
										<label className="font-semibold text-foreground text-[11px] uppercase flex items-center gap-1.5">
											<Clock className="h-3 w-3 text-primary" />
											Rentang Jam (WIB)
										</label>
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => {
													setFilterStartTime("08:00");
													setFilterEndTime("12:00");
												}}
												className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
											>
												Pagi (08-12)
											</button>
											<button
												type="button"
												onClick={() => {
													setFilterStartTime("13:00");
													setFilterEndTime("17:00");
												}}
												className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
											>
												Siang (13-17)
											</button>
											<button
												type="button"
												onClick={() => {
													setFilterStartTime("08:00");
													setFilterEndTime("17:00");
												}}
												className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
											>
												Seharian
											</button>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<input
											type="time"
											value={filterStartTime}
											onChange={(e) => setFilterStartTime(e.target.value)}
											onClick={(e) => {
												try {
													e.currentTarget.showPicker?.();
												} catch {}
											}}
											className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-mono cursor-pointer"
										/>
										<input
											type="time"
											value={filterEndTime}
											onChange={(e) => setFilterEndTime(e.target.value)}
											onClick={(e) => {
												try {
													e.currentTarget.showPicker?.();
												} catch {}
											}}
											className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-mono cursor-pointer"
										/>
									</div>
								</div>

								{/* Filter Toggle & Status Overview */}
								<div className="lg:col-span-4 flex flex-col justify-between gap-2.5 bg-muted/40 p-3 rounded-lg border border-border/70 h-[62px]">
									<label className="flex items-center gap-2 cursor-pointer select-none">
										<input
											type="checkbox"
											checked={availableOnly}
											disabled={!filterDate}
											onChange={(e) => setAvailableOnly(e.target.checked)}
											className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer disabled:opacity-50"
										/>
										<span className="text-xs font-semibold text-foreground">
											Hanya Tampilkan yang Kosong
										</span>
									</label>

									<div className="flex items-center gap-2 text-[11px]">
										{filterDate ? (
											availabilityStats ? (
												<div className="flex items-center gap-2 font-mono">
													<span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
														<span className="h-2 w-2 rounded-full bg-emerald-500" />
														{availabilityStats.availableCount} Kosong
													</span>
													<span className="text-border">|</span>
													<span className="inline-flex items-center gap-1.5 text-destructive font-bold">
														<span className="h-2 w-2 rounded-full bg-destructive" />
														{availabilityStats.occupiedCount} Terpakai
													</span>
												</div>
											) : (
												<span className="text-muted-foreground">Menghitung status...</span>
											)
										) : (
											<span className="text-muted-foreground text-[10px]">
												💡 Masukkan tanggal di atas untuk melihat status real-time.
											</span>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Catalog Grid */}
						{filteredAssets.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
								<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
									<Filter className="h-5 w-5" />
								</div>
								<h3 className="font-semibold text-sm text-foreground">
									Tidak Ada Sarana Ditemukan
								</h3>
								<p className="text-xs text-muted-foreground max-w-sm mx-auto">
									{filterDate && availableOnly
										? "Semua sarana pada kategori ini sedang terpakai pada rentang waktu yang dipilih. Coba matikan opsi 'Hanya Tampilkan yang Kosong' atau pilih tanggal lain."
										: "Silakan sesuaikan kata kunci pencarian atau reset filter kategori."}
								</p>
								<button
									type="button"
									onClick={() => {
										setSearchQuery("");
										setTypeFilter("all");
										setAvailableOnly(false);
									}}
									className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary hover:underline pt-2 cursor-pointer"
								>
									[RESET FILTER]
								</button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
								{filteredAssets.map((asset) => (
									<AssetCard
										key={asset.id}
										asset={asset}
										availability={availabilityMap[asset.id]}
										isFilteredByDate={Boolean(filterDate)}
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
