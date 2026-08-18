import {
	Activity,
	BellRing,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	Mail,
	QrCode,
	Radio,
	ShieldCheck,
	Terminal,
} from "lucide-react";
import { useState } from "react";

type TabMode = "matrix" | "ticket" | "pipeline";

export function HeroConsole() {
	const [activeTab, setActiveTab] = useState<TabMode>("matrix");
	const [selectedSlot, setSelectedSlot] = useState<string>("09:00 - 11:30");
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative mx-auto w-full max-w-lg lg:max-w-none">
			{/* Ambient Gradient Glow behind the console */}
			<div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-sky-500/30 via-indigo-500/20 to-teal-500/30 opacity-75 blur-xl transition-all dark:from-sky-500/20 dark:via-indigo-500/15 dark:to-cyan-500/20" />

			{/* Terminal / IDE Shell */}
			<div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md">
				{/* Top Window Bar */}
				<div className="flex items-center justify-between border-b border-border/70 bg-muted/50 px-4 py-2.5">
					<div className="flex items-center gap-2">
						<div className="flex gap-1.5">
							<span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
							<span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
							<span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
						</div>
						<span className="ml-2 font-mono text-[11px] text-muted-foreground">
							sarpras-console.live.ts
						</span>
					</div>

					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
							<Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
							ENGINE ACTIVE
						</span>
					</div>
				</div>

				{/* Interactive Tab Switcher */}
				<div className="flex border-b border-border/60 bg-muted/20 px-2 pt-2">
					<button
						type="button"
						onClick={() => setActiveTab("matrix")}
						className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
							activeTab === "matrix"
								? "border-primary text-foreground bg-card/60 rounded-t"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<Calendar className="h-3.5 w-3.5 text-sky-500" />
						<span>01. Live Slot Matrix</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("ticket")}
						className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
							activeTab === "ticket"
								? "border-primary text-foreground bg-card/60 rounded-t"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<QrCode className="h-3.5 w-3.5 text-indigo-500" />
						<span>02. E-Ticket Digital</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("pipeline")}
						className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
							activeTab === "pipeline"
								? "border-primary text-foreground bg-card/60 rounded-t"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<Activity className="h-3.5 w-3.5 text-emerald-500" />
						<span>03. Pipeline Dispatch</span>
					</button>
				</div>

				{/* Tab Content Body */}
				<div className="p-4 sm:p-5">
					{/* TAB 1: LIVE SLOT MATRIX */}
					{activeTab === "matrix" && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<div className="flex items-center gap-2">
										<span className="font-semibold text-sm text-foreground">
											Auditorium PPKASN
										</span>
										<span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-600 dark:text-sky-400 font-medium">
											Kapasitas 120
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Jadwal Hari Ini: Sesi Pagi & Siang
									</p>
								</div>
								<span className="font-mono text-[11px] text-muted-foreground">
									Gedung B Lt. 2
								</span>
							</div>

							{/* Slot Grid Simulator */}
							<div className="grid grid-cols-3 gap-2">
								{[
									{
										time: "08:00 - 09:30",
										status: "booked",
										title: "Rapat Ditjen Nakes",
									},
									{
										time: "09:00 - 11:30",
										status: "selected",
										title: "Slot Tersedia (Pilih)",
									},
									{
										time: "13:00 - 15:30",
										status: "available",
										title: "Bisa Dipesan",
									},
									{
										time: "15:30 - 17:00",
										status: "available",
										title: "Bisa Dipesan",
									},
									{
										time: "19:00 - 21:00",
										status: "maintenance",
										title: "Sterilisasi Ruang",
									},
									{
										time: "Sesi Besok",
										status: "open",
										title: "Buka Reservasi",
									},
								].map((slot, idx) => {
									const isSelected = selectedSlot === slot.time;
									const isBooked = slot.status === "booked";
									const isMaint = slot.status === "maintenance";

									return (
										<button
											key={idx}
											type="button"
											disabled={isBooked || isMaint}
											onClick={() => setSelectedSlot(slot.time)}
											className={`group relative flex flex-col items-start rounded-md border p-2 text-left transition-all cursor-pointer ${
												isSelected
													? "border-primary bg-primary/10 ring-1 ring-primary"
													: isBooked
														? "border-border/40 bg-muted/40 opacity-60 cursor-not-allowed"
														: isMaint
															? "border-amber-500/20 bg-amber-500/5 text-muted-foreground cursor-not-allowed"
															: "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/30"
											}`}
										>
											<span className="font-mono text-[10px] font-bold text-foreground">
												{slot.time}
											</span>
											<span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
												{slot.title}
											</span>
											<div className="mt-1.5 flex items-center gap-1 font-mono text-[9px]">
												{isBooked && (
													<span className="text-rose-500 font-medium">
														TERISI
													</span>
												)}
												{isMaint && (
													<span className="text-amber-500 font-medium">
														CLEANING
													</span>
												)}
												{!isBooked && !isMaint && (
													<span
														className={
															isSelected
																? "text-primary font-bold"
																: "text-emerald-600 dark:text-emerald-400 font-medium"
														}
													>
														{isSelected ? "TERPILIH" : "TERSEDIA"}
													</span>
												)}
											</div>
										</button>
									);
								})}
							</div>

							{/* Live Spec Bar */}
							<div className="rounded-md border border-border/80 bg-muted/30 p-2.5 flex items-center justify-between font-mono text-xs">
								<div className="flex items-center gap-2 text-muted-foreground">
									<Clock className="h-3.5 w-3.5 text-primary" />
									<span>Slot Dipilih:</span>
									<span className="font-bold text-foreground">
										{selectedSlot}
									</span>
								</div>
								<span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
									<CheckCircle2 className="h-3.5 w-3.5" /> Siap Diajukan
								</span>
							</div>
						</div>
					)}

					{/* TAB 2: DIGITAL E-TICKET PASS */}
					{activeTab === "ticket" && (
						<div className="space-y-3">
							<div className="rounded-lg border border-border/90 bg-gradient-to-br from-card via-card to-muted/30 p-4 space-y-3">
								<div className="flex items-start justify-between border-b border-border/60 pb-3">
									<div>
										<span className="font-mono text-[10px] uppercase font-bold tracking-widest text-primary">
											KEMENSETNEG // PPKASN
										</span>
										<h4 className="text-sm font-bold text-foreground">
											SURAT IJIN AKSES FASILITAS
										</h4>
										<p className="text-[11px] font-mono text-muted-foreground">
											NO: BK-2026-0814-042
										</p>
									</div>
									<div className="rounded border border-border bg-white p-1 shadow-2xs">
										<QrCode className="h-10 w-10 text-slate-900" />
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 text-xs">
									<div>
										<span className="text-[10px] text-muted-foreground block">
											Sarana / Ruangan
										</span>
										<span className="font-medium text-foreground">
											Ruang Rapat Garuda 01
										</span>
									</div>
									<div>
										<span className="text-[10px] text-muted-foreground block">
											Pemohon / Unit
										</span>
										<span className="font-medium text-foreground">
											Biro SDM & Umum
										</span>
									</div>
									<div>
										<span className="text-[10px] text-muted-foreground block">
											Waktu Pelaksanaan
										</span>
										<span className="font-medium text-foreground">
											18 Agu 2026, 09:00 WIB
										</span>
									</div>
									<div>
										<span className="text-[10px] text-muted-foreground block">
											Status Verifikasi
										</span>
										<span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
											<ShieldCheck className="h-3 w-3" /> DISETUJUI
										</span>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between text-xs text-muted-foreground px-1">
								<span className="font-mono text-[10px]">
									SHA-256: 7f8a9...b4012
								</span>
								<button
									type="button"
									onClick={handleCopy}
									className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
								>
									{copied ? (
										<Check className="h-3 w-3" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									<span>{copied ? "Tersalin!" : "Salin Kode Tiket"}</span>
								</button>
							</div>
						</div>
					)}

					{/* TAB 3: PIPELINE DISPATCH */}
					{activeTab === "pipeline" && (
						<div className="space-y-3">
							<div className="space-y-2 font-mono text-xs">
								{/* Stage 1 */}
								<div className="flex items-center justify-between rounded border border-border bg-card p-2.5">
									<div className="flex items-center gap-2">
										<div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
											<Check className="h-3 w-3" />
										</div>
										<div>
											<span className="font-semibold text-foreground">
												01. Form Submission
											</span>
											<p className="text-[10px] text-muted-foreground font-sans">
												Identitas pemohon & agenda tervalidasi
											</p>
										</div>
									</div>
									<span className="text-[10px] text-muted-foreground">
										0.2s
									</span>
								</div>

								{/* Stage 2 */}
								<div className="flex items-center justify-between rounded border border-border bg-card p-2.5">
									<div className="flex items-center gap-2">
										<div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
											<Check className="h-3 w-3" />
										</div>
										<div>
											<span className="font-semibold text-foreground">
												02. Operator Verifikasi
											</span>
											<p className="text-[10px] text-muted-foreground font-sans">
												Pengecekan fasilitas & kelayakan ruangan
											</p>
										</div>
									</div>
									<span className="text-[10px] text-emerald-500 font-bold">
										VALID
									</span>
								</div>

								{/* Stage 3 */}
								<div className="flex items-center justify-between rounded border border-primary/40 bg-primary/5 p-2.5">
									<div className="flex items-center gap-2">
										<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
											<BellRing className="h-3 w-3 animate-pulse" />
										</div>
										<div>
											<span className="font-semibold text-foreground">
												03. Multi-Channel Alert
											</span>
											<p className="text-[10px] text-muted-foreground font-sans">
												WhatsApp + Email notifikasi terkirim otomatis
											</p>
										</div>
									</div>
									<span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-600 dark:text-sky-400">
										<Mail className="h-2.5 w-2.5" /> SENT
									</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Console Footer Status */}
				<div className="border-t border-border/70 bg-muted/40 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
					<div className="flex items-center gap-1.5">
						<Terminal className="h-3 w-3 text-primary" />
						<span>TanStack Start SSR + Drizzle ORM</span>
					</div>
					<span className="text-emerald-600 dark:text-emerald-400 font-medium">
						100% Operational
					</span>
				</div>
			</div>
		</div>
	);
}
