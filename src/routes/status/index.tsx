import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	HelpCircle,
	Info,
	Search,
	ShieldCheck,
} from "lucide-react";
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

			<main className="flex-1 py-12 sm:py-20">
				<div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-10">
					{/* Header */}
					<div className="text-center space-y-3">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<Search className="h-6 w-6" />
						</div>
						<h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
							Cek Status Permohonan
						</h1>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">
							Pantau proses verifikasi dan status persetujuan peminjaman sarana
							PPKASN Anda secara real-time.
						</p>
					</div>

					{/* Search Card */}
					<div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<label className="text-xs font-bold uppercase tracking-wider text-foreground">
									Kode Referensi / ID Permohonan
								</label>
								<div className="relative">
									<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
									<input
										type="text"
										value={refInput}
										onChange={(e) => {
											setRefInput(e.target.value);
											if (inputError) setInputError("");
										}}
										placeholder="Masukkan ID / Kode referensi (misal: a0eebc99-...)"
										className="w-full rounded-2xl border border-border bg-background pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
									/>
								</div>
								{inputError && (
									<p className="text-xs text-destructive">{inputError}</p>
								)}
							</div>

							<button
								type="submit"
								className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-6 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
							>
								<Search className="h-4 w-4" />
								Lacak Permohonan
							</button>
						</form>

						{/* Help Box */}
						<div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-2 border border-border/60">
							<div className="flex items-center gap-1.5 font-semibold text-foreground">
								<HelpCircle className="h-4 w-4 text-primary shrink-0" />
								<span>Di mana saya menemukan kode referensi?</span>
							</div>
							<p className="leading-relaxed">
								Kode referensi berupa UUID 36 karakter yang ditampilkan pada layar
								konfirmasi setelah Anda mengirim formulir peminjaman.
							</p>
						</div>
					</div>
				</div>
			</main>

			<PublicFooter />
		</div>
	);
}
