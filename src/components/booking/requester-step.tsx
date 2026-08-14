import { Building, FileText, Mail, Phone, User } from "lucide-react";
import { useState } from "react";

export interface RequesterStepData {
	requesterName: string;
	requesterEmail: string;
	requesterPhone: string;
	requesterOrganization: string;
	purpose: string;
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

	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!name.trim()) newErrors.name = "Nama lengkap wajib diisi";
		if (!email.trim()) {
			newErrors.email = "Alamat email wajib diisi";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			newErrors.email = "Format email tidak valid";
		}
		if (!phone.trim()) newErrors.phone = "Nomor WhatsApp / telepon wajib diisi";
		if (!organization.trim())
			newErrors.organization = "Unit kerja / instansi wajib diisi";
		if (!purpose.trim())
			newErrors.purpose = "Tujuan penggunaan / nama acara wajib diisi";

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
			});
			onNext();
		}
	};

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
				<div className="border-b border-border/60 pb-4">
					<h3 className="text-lg font-bold text-foreground">
						Identitas Pemohon & Detail Kegiatan
					</h3>
					<p className="text-xs text-muted-foreground">
						Lengkapi data diri penanggung jawab permohonan. Kode referensi
						pelacakan status akan dikaitkan dengan email ini.
					</p>
				</div>

				<div className="space-y-4">
					{/* Name & Email */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<User className="h-3.5 w-3.5 text-primary" />
								Nama Lengkap Penanggung Jawab
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (errors.name) setErrors({ ...errors, name: "" });
								}}
								placeholder="Contoh: Dr. Budi Santoso, M.Kes"
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
							/>
							{errors.name && (
								<p className="text-xs text-destructive">{errors.name}</p>
							)}
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
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
								placeholder="nama@kemkes.go.id"
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
							/>
							{errors.email && (
								<p className="text-xs text-destructive">{errors.email}</p>
							)}
						</div>
					</div>

					{/* Phone & Organization */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Phone className="h-3.5 w-3.5 text-primary" />
								Nomor WhatsApp / Telepon
							</label>
							<input
								type="tel"
								value={phone}
								onChange={(e) => {
									setPhone(e.target.value);
									if (errors.phone) setErrors({ ...errors, phone: "" });
								}}
								placeholder="081234567890"
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
							/>
							{errors.phone && (
								<p className="text-xs text-destructive">{errors.phone}</p>
							)}
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
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
								className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
							/>
							{errors.organization && (
								<p className="text-xs text-destructive">
									{errors.organization}
								</p>
							)}
						</div>
					</div>

					{/* Purpose */}
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
							<FileText className="h-3.5 w-3.5 text-primary" />
							Tujuan Penggunaan / Nama Kegiatan
						</label>
						<textarea
							rows={3}
							value={purpose}
							onChange={(e) => {
								setPurpose(e.target.value);
								if (errors.purpose) setErrors({ ...errors, purpose: "" });
							}}
							placeholder="Jelaskan agenda kegiatan secara ringkas..."
							className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden resize-none"
						/>
						{errors.purpose && (
							<p className="text-xs text-destructive">{errors.purpose}</p>
						)}
					</div>
				</div>
			</div>

			{/* Action Nav */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
				>
					&larr; Kembali
				</button>
				<button
					type="button"
					onClick={handleProceed}
					className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
				>
					Lanjut ke Konfirmasi &rarr;
				</button>
			</div>
		</div>
	);
}
