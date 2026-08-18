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
		<div className="space-y-4">
			<div className="rounded-lg border border-border bg-card p-5 space-y-4">
				<div className="border-b border-border pb-3">
					<h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
						IDENTITAS PENANGGUNG JAWAB & DETAIL ACARA
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Data kontak ini akan digunakan untuk pengiriman kode referensi dan pembaruan notifikasi.
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
							<label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 uppercase">
								<Phone className="h-3.5 w-3.5 text-primary" />
								Nomor WhatsApp
							</label>
							<input
								type="tel"
								value={phone}
								onChange={(e) => {
									setPhone(e.target.value);
									if (errors.phone) setErrors({ ...errors, phone: "" });
								}}
								placeholder="081234567890"
								className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden font-sans"
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
							rows={3}
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
					className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-2xs"
				>
					<span>LANJUT KE KONFIRMASI</span>
					<span>&rarr;</span>
				</button>
			</div>
		</div>
	);
}
