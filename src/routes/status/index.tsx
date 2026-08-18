import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HelpCircle, Search, Terminal } from "lucide-react";
import { useState } from "react";
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";

export const Route = createFileRoute("/status/")({
	component: StatusLookupPage,
});

function StatusLookupPage() {
	const navigate = useNavigate();
	const [refInput, setRefInput] = useState("");
	const [inputError, setInputError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = refInput.trim();
		if (!trimmed) {
			setInputError("Silakan masukkan Kode Referensi atau ID Permohonan");
			return;
		}

		navigate({ to: `/status/${trimmed}` });
	};

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
			<PublicHeader />

			<main className="flex-1 py-12 sm:py-16">
				<div className="mx-auto max-w-xl px-4 sm:px-6 space-y-6">
					{/* Header */}
					<div className="space-y-2 border-b border-border pb-5">
						<div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary">
							<Terminal className="h-3.5 w-3.5" />
							<span>STATUS // TRACKER</span>
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Cek Status Permohonan
						</h1>
						<p className="text-xs text-muted-foreground leading-relaxed">
							Pantau proses verifikasi berkas, persetujuan pimpinan, dan status
							jadwal peminjaman secara real-time.
						</p>
					</div>

					{/* Search Card */}
					<div className="rounded-lg border border-border bg-card p-5 space-y-4">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<label className="font-mono text-[11px] font-semibold uppercase text-foreground">
									KODE REFERENSI / ID BOOKING:
								</label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<input
										type="text"
										value={refInput}
										onChange={(e) => {
											setRefInput(e.target.value);
											if (inputError) setInputError("");
										}}
										placeholder="misal: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
										className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
									/>
								</div>
								{inputError && (
									<p className="font-mono text-[11px] text-destructive">
										{inputError}
									</p>
								)}
							</div>

							<button
								type="submit"
								className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-4 font-mono text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 cursor-pointer shadow-2xs"
							>
								<Search className="h-3.5 w-3.5" />
								<span>[LACAK STATUS TIKET]</span>
							</button>
						</form>

						{/* Info Note */}
						<div className="rounded-md bg-muted/40 p-3 font-mono text-[11px] text-muted-foreground space-y-1 border border-border/60">
							<div className="flex items-center gap-1.5 font-semibold text-foreground">
								<HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
								<span>DI MANA KODE REFERENSI SAYA?</span>
							</div>
							<p className="text-[11px] leading-relaxed">
								Kode referensi berupa UUID 36 karakter yang diterbitkan saat
								pengajuan selesai atau tertera pada notifikasi WhatsApp / Email
								Anda.
							</p>
						</div>
					</div>
				</div>
			</main>

			<PublicFooter />
		</div>
	);
}
