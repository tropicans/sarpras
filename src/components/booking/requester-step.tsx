import {
	Building,
	CheckCircle2,
	FileText,
	Loader2,
	Mail,
	Paperclip,
	Phone,
	Trash2,
	UploadCloud,
	User,
} from "lucide-react";
import { useRef, useState } from "react";
import { uploadBookingLetterFn } from "#/lib/booking/upload-letter.functions";
import { normalizePhoneNumber } from "#/lib/whatsapp/phone";

export interface RequesterStepData {
	requesterName: string;
	requesterEmail: string;
	requesterPhone: string;
	requesterOrganization: string;
	purpose: string;
	letterFileName?: string;
	letterFileUrl?: string;
}

interface RequesterStepProps {
	data: RequesterStepData;
	onChange: (updated: Partial<RequesterStepData>) => void;
	onNext: () => void;
	onBack: () => void;
}

export function RequesterStep({
	data,
	onChange,
	onNext,
	onBack,
}: RequesterStepProps) {
	const [name, setName] = useState(data.requesterName || "");
	const [email, setEmail] = useState(data.requesterEmail || "");
	const [phone, setPhone] = useState(data.requesterPhone || "");
	const [organization, setOrganization] = useState(
		data.requesterOrganization || "",
	);
	const [purpose, setPurpose] = useState(data.purpose || "");

	// PDF Letter state
	const [letterFileName, setLetterFileName] = useState(
		data.letterFileName || "",
	);
	const [letterFileUrl, setLetterFileUrl] = useState(data.letterFileUrl || "");
	const [uploadingLetter, setUploadingLetter] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleFileSelect = async (file: File | null | undefined) => {
		if (!file) return;
		setUploadError("");

		if (
			!file.name.toLowerCase().endsWith(".pdf") &&
			file.type !== "application/pdf"
		) {
			setUploadError("Format berkas harus dokumen PDF (.pdf).");
			return;
		}

		const MAX_SIZE = 5 * 1024 * 1024; // 5MB
		if (file.size > MAX_SIZE) {
			setUploadError(
				"Ukuran berkas melebihi 5MB. Silakan kompresi berkas PDF Anda.",
			);
			return;
		}

		if (file.size === 0) {
			setUploadError("Berkas PDF tidak boleh kosong (0 byte).");
			return;
		}

		setUploadingLetter(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const result = await uploadBookingLetterFn({ data: formData });
			setLetterFileName(result.fileName);
			setLetterFileUrl(result.fileUrl);
			setErrors((prev) => ({ ...prev, letter: "" }));
		} catch (err: any) {
			setUploadError(err.message || "Gagal mengunggah berkas surat.");
		} finally {
			setUploadingLetter(false);
		}
	};

	const handleRemoveLetter = () => {
		setLetterFileName("");
		setLetterFileUrl("");
		setUploadError("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = "Nama lengkap wajib diisi";
		if (!email.trim()) {
			newErrors.email = "Alamat email wajib diisi";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			newErrors.email = "Format email tidak valid";
		}
		if (!phone.trim()) {
			newErrors.phone = "Nomor WhatsApp wajib diisi";
		} else if (normalizePhoneNumber(phone.trim()) === null) {
			newErrors.phone =
				"Format nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789)";
		}
		if (!organization.trim())
			newErrors.organization = "Unit kerja / instansi wajib diisi";
		if (!purpose.trim())
			newErrors.purpose = "Tujuan penggunaan / nama acara wajib diisi";

		// Mandatory PDF Letter check
		if (!letterFileUrl || !letterFileName) {
			newErrors.letter =
				"Surat permohonan dinas / nota dinas (format PDF) wajib diunggah";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleProceed = () => {
		if (validate()) {
			onChange({
				requesterName: name.trim(),
				requesterEmail: email.trim(),
				requesterPhone: phone.trim(),
				requesterOrganization: organization.trim(),
				purpose: purpose.trim(),
				letterFileName: letterFileName.trim(),
				letterFileUrl: letterFileUrl.trim(),
			});
			onNext();
		}
	};

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-border bg-card p-5 space-y-4">
				<div className="border-b border-border pb-3">
					<h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
						IDENTITAS PENANGGUNG JAWAB & DETAIL ACARA
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Data kontak dan surat permohonan ini akan digunakan oleh operator untuk verifikasi dan penerbitan persetujuan.
					</p>
				</div>

				<div className="space-y-3 font-mono text-xs">
					{/* Name & Email */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<User className="h-3.5 w-3.5 text-primary" />
								Nama Lengkap
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (errors.name) setErrors({ ...errors, name: "" });
								}}
								placeholder="Dr. Budi Santoso, M.Kes"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-sans"
							/>
							{errors.name && (
								<p className="text-[11px] text-destructive">{errors.name}</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Mail className="h-3.5 w-3.5 text-primary" />
								Email Kedinasan / Aktif
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									if (errors.email) setErrors({ ...errors, email: "" });
								}}
								placeholder="nama@setneg.go.id"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-sans"
							/>
							{errors.email && (
								<p className="text-[11px] text-destructive">{errors.email}</p>
							)}
						</div>
					</div>

					{/* Phone & Organization */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
									<Phone className="h-3.5 w-3.5 text-primary" />
									Nomor WhatsApp
								</label>
								<span className="text-[10px] text-muted-foreground">
									Contoh: 08123456789
								</span>
							</div>
							<input
								type="tel"
								value={phone}
								onChange={(e) => {
									setPhone(e.target.value);
									if (errors.phone) setErrors({ ...errors, phone: "" });
								}}
								onBlur={() => {
									if (
										phone.trim() &&
										normalizePhoneNumber(phone.trim()) === null
									) {
										setErrors((prev) => ({
											...prev,
											phone:
												"Format nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789)",
										}));
									}
								}}
								placeholder="081234567890"
								className={`w-full rounded-md border bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden font-sans ${
									errors.phone
										? "border-destructive focus:border-destructive"
										: "border-border focus:border-primary"
								}`}
							/>
							{errors.phone && (
								<p className="text-[11px] text-destructive">{errors.phone}</p>
							)}
						</div>

						<div className="space-y-1">
							<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Building className="h-3.5 w-3.5 text-primary" />
								Unit Kerja / Instansi
							</label>
							<input
								type="text"
								value={organization}
								onChange={(e) => {
									setOrganization(e.target.value);
									if (errors.organization)
										setErrors({ ...errors, organization: "" });
								}}
								placeholder="Pusat Pengembangan Kompetensi ASN"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-sans"
							/>
							{errors.organization && (
								<p className="text-[11px] text-destructive">
									{errors.organization}
								</p>
							)}
						</div>
					</div>

					{/* Purpose */}
					<div className="space-y-1">
						<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
							<FileText className="h-3.5 w-3.5 text-primary" />
							Tujuan Penggunaan / Nama Kegiatan
						</label>
						<textarea
							rows={2}
							value={purpose}
							onChange={(e) => {
								setPurpose(e.target.value);
								if (errors.purpose) setErrors({ ...errors, purpose: "" });
							}}
							placeholder="Jelaskan agenda kegiatan secara ringkas..."
							className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden resize-none font-sans"
						/>
						{errors.purpose && (
							<p className="text-[11px] text-destructive">{errors.purpose}</p>
						)}
					</div>

					{/* Mandatory PDF Letter Upload Section */}
					<div className="space-y-1.5 pt-2 border-t border-border/80">
						<div className="flex items-center justify-between">
							<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Paperclip className="h-3.5 w-3.5 text-primary" />
								Surat Permohonan / Nota Dinas
								<span className="text-[10px] text-destructive font-bold">
									(WAJIB)
								</span>
							</label>
							<span className="text-[10px] text-muted-foreground">
								Format PDF &bull; Maks. 5MB
							</span>
						</div>

						{/* Hidden File Input */}
						<input
							type="file"
							ref={fileInputRef}
							accept=".pdf,application/pdf"
							className="hidden"
							onChange={(e) => handleFileSelect(e.target.files?.[0])}
						/>

						{/* Drag and Drop Zone or Uploaded File Preview */}
						{!letterFileUrl ? (
							<div
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragOver(true);
								}}
								onDragLeave={() => setIsDragOver(false)}
								onDrop={(e) => {
									e.preventDefault();
									setIsDragOver(false);
									handleFileSelect(e.dataTransfer.files?.[0]);
								}}
								onClick={() => fileInputRef.current?.click()}
								className={`rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
									isDragOver
										? "border-primary bg-primary/5"
										: errors.letter || uploadError
											? "border-destructive/60 bg-destructive/5 hover:border-destructive"
											: "border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
								}`}
							>
								{uploadingLetter ? (
									<div className="flex flex-col items-center justify-center gap-1.5 py-2">
										<Loader2 className="h-6 w-6 animate-spin text-primary" />
										<span className="text-xs font-semibold text-foreground">
											Mengunggah berkas PDF...
										</span>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center gap-1.5 py-1">
										<UploadCloud className="h-6 w-6 text-muted-foreground" />
										<div>
											<span className="font-semibold text-xs text-primary underline">
												Pilih Dokumen PDF
											</span>
											<span className="text-muted-foreground text-xs">
												{" "}
												atau seret file ke sini
											</span>
										</div>
										<p className="text-[10px] text-muted-foreground">
											Lampirkan surat permohonan atau nota dinas resmi dari instansi Anda.
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
										<FileText className="h-4 w-4" />
									</div>
									<div className="min-w-0">
										<p className="text-xs font-semibold text-foreground truncate">
											{letterFileName}
										</p>
										<div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400">
											<span className="inline-flex items-center gap-1 font-semibold">
												<CheckCircle2 className="h-3 w-3" />
												Berkas PDF Terlampir
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={handleRemoveLetter}
										className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
										title="Hapus / Ganti Berkas"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}

						{uploadError && (
							<p className="text-[11px] text-destructive">{uploadError}</p>
						)}
						{errors.letter && !uploadError && (
							<p className="text-[11px] text-destructive">{errors.letter}</p>
						)}
					</div>
				</div>
			</div>

			{/* Action Nav */}
			<div className="flex items-center justify-between font-mono">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
				>
					&larr; KEMBALI
				</button>
				<button
					type="button"
					onClick={handleProceed}
					disabled={uploadingLetter}
					className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
				>
					<span>LANJUT KE KONFIRMASI</span>
					<span>&rarr;</span>
				</button>
			</div>
		</div>
	);
}

