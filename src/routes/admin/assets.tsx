import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Archive,
	Calendar,
	Check,
	Clock,
	Edit2,
	Plus,
	Sparkles,
	Tag,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	archiveAssetFn,
	getAssetSchedulesFn,
	getAssetsListFn,
	saveAssetFn,
	saveAssetSchedulesFn,
} from "#/lib/assets/assets.functions";
import {
	CATEGORY_FACILITY_PRESETS,
	getAssetFacilities,
} from "#/lib/assets/facilities";
import {
	ASSET_TYPE_LABELS,
	ASSET_TYPES,
	type AssetType,
} from "#/lib/booking/types";

// --- Component ---

export const Route = createFileRoute("/admin/assets")({
	component: AdminAssetsComponent,
});

type Asset = {
	id: string;
	name: string;
	type: string;
	location?: string | null;
	capacity: number;
	roomLayouts?: Array<{ id: string; name: string; maxCapacity: number }> | null;
	facilities?: string[] | null;
	status: string;
	createdAt: string | Date;
};

const DAYS_ID = [
	"Minggu",
	"Senin",
	"Selasa",
	"Rabu",
	"Kamis",
	"Jumat",
	"Sabtu",
];

function AdminAssetsComponent() {
	const { user: currentUser } = Route.useRouteContext();
	const [assetsList, setAssetsList] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Form State (Add / Edit)
	const [showForm, setShowForm] = useState(false);
	const [formId, setFormId] = useState<string | undefined>(undefined);
	const [formName, setFormName] = useState("");
	const [formType, setFormType] = useState<string>("room");
	const [formLocation, setFormLocation] = useState("");
	const [formCapacity, setFormCapacity] = useState(50);
	const [formFacilities, setFormFacilities] = useState<string[]>([]);
	const [customTagInput, setCustomTagInput] = useState("");
	const [formStatus, setFormStatus] = useState("active");
	const [formError, setFormError] = useState<string | null>(null);
	const [formLoading, setFormLoading] = useState(false);

	// Room Layouts Configuration State
	const [formLayoutIslandEnabled, setFormLayoutIslandEnabled] = useState(true);
	const [formLayoutIslandCap, setFormLayoutIslandCap] = useState(35);
	const [formLayoutUshapeEnabled, setFormLayoutUshapeEnabled] = useState(true);
	const [formLayoutUshapeCap, setFormLayoutUshapeCap] = useState(25);
	const [formLayoutClassroomEnabled, setFormLayoutClassroomEnabled] = useState(true);
	const [formLayoutClassroomCap, setFormLayoutClassroomCap] = useState(42);

	// Scheduling State
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [scheduleAsset, setScheduleAsset] = useState<Asset | null>(null);
	const [availList, setAvailList] = useState<
		Array<{ dayOfWeek: number; openTime: string; closeTime: string }>
	>([]);
	const [closuresList, setClosuresList] = useState<Array<{ date: string }>>([]);
	const [scheduleLoading, setScheduleLoading] = useState(false);
	const [scheduleError, setScheduleError] = useState<string | null>(null);

	// New slot entry state
	const [newDay, setNewDay] = useState(1);
	const [newOpen, setNewOpen] = useState("08:00");
	const [newClose, setNewClose] = useState("16:00");

	// New closure entry state
	const [newClosureDate, setNewClosureDate] = useState("");

	// Archive Confirm Modal State
	const [archiveTarget, setArchiveTarget] = useState<Asset | null>(null);
	const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const fetchAssets = () => {
		setLoading(true);
		setError(null);
		getAssetsListFn()
			.then((data) => setAssetsList(data as any))
			.catch(() => setError("Gagal memuat daftar aset/fasilitas."))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchAssets();
	}, []);

	const handleOpenCreate = () => {
		setFormId(undefined);
		setFormName("");
		setFormType("room");
		setFormLocation("");
		setFormCapacity(50);
		setFormFacilities([]);
		setCustomTagInput("");
		setFormLayoutIslandEnabled(true);
		setFormLayoutIslandCap(35);
		setFormLayoutUshapeEnabled(true);
		setFormLayoutUshapeCap(25);
		setFormLayoutClassroomEnabled(true);
		setFormLayoutClassroomCap(42);
		setFormStatus("active");
		setFormError(null);
		setShowForm(true);
	};

	const handleOpenEdit = (asset: Asset) => {
		setFormId(asset.id);
		setFormName(asset.name);
		setFormType(asset.type);
		setFormLocation(asset.location || "");
		setFormCapacity(asset.capacity);
		setFormFacilities(asset.facilities ? [...asset.facilities] : []);
		setCustomTagInput("");
		setFormStatus(asset.status);

		if (asset.roomLayouts !== undefined && asset.roomLayouts !== null) {
			const island = asset.roomLayouts.find((l) => l.id === "island");
			const ushape = asset.roomLayouts.find((l) => l.id === "ushape");
			const classroom = asset.roomLayouts.find((l) => l.id === "classroom");

			setFormLayoutIslandEnabled(Boolean(island));
			setFormLayoutIslandCap(island?.maxCapacity ?? Math.max(1, Math.round(asset.capacity * 0.7)));

			setFormLayoutUshapeEnabled(Boolean(ushape));
			setFormLayoutUshapeCap(ushape?.maxCapacity ?? Math.max(1, Math.round(asset.capacity * 0.5)));

			setFormLayoutClassroomEnabled(Boolean(classroom));
			setFormLayoutClassroomCap(classroom?.maxCapacity ?? Math.max(1, Math.round(asset.capacity * 0.85)));
		} else {
			setFormLayoutIslandEnabled(true);
			setFormLayoutIslandCap(Math.max(1, Math.round(asset.capacity * 0.7)));
			setFormLayoutUshapeEnabled(true);
			setFormLayoutUshapeCap(Math.max(1, Math.round(asset.capacity * 0.5)));
			setFormLayoutClassroomEnabled(true);
			setFormLayoutClassroomCap(Math.max(1, Math.round(asset.capacity * 0.85)));
		}

		setFormError(null);
		setShowForm(true);
	};

	const handleCapacityChange = (cap: number) => {
		setFormCapacity(cap);
		if (cap > 0) {
			setFormLayoutIslandCap(Math.max(1, Math.round(cap * 0.7)));
			setFormLayoutUshapeCap(Math.max(1, Math.round(cap * 0.5)));
			setFormLayoutClassroomCap(Math.max(1, Math.round(cap * 0.85)));
		}
	};

	const handleAddTag = (tagToAdd: string) => {
		const trimmed = tagToAdd.trim();
		if (!trimmed) return;
		if (formFacilities.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
			return;
		}
		if (formFacilities.length >= 20) {
			return;
		}
		setFormFacilities((prev) => [...prev, trimmed.slice(0, 40)]);
		setCustomTagInput("");
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setFormFacilities((prev) => prev.filter((t) => t !== tagToRemove));
	};

	const handleTogglePreset = (presetTag: string) => {
		const exists = formFacilities.some(
			(t) => t.toLowerCase() === presetTag.toLowerCase(),
		);
		if (exists) {
			setFormFacilities((prev) =>
				prev.filter((t) => t.toLowerCase() !== presetTag.toLowerCase()),
			);
		} else {
			handleAddTag(presetTag);
		}
	};

	const handleSaveAsset = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formName || formCapacity <= 0) {
			setFormError("Nama aset dan kapasitas (minimal 1) wajib diisi.");
			return;
		}

		const roomLayoutsList = [];
		if (formType === "room") {
			if (formLayoutIslandEnabled) {
				roomLayoutsList.push({ id: "island", name: "Island", maxCapacity: formLayoutIslandCap });
			}
			if (formLayoutUshapeEnabled) {
				roomLayoutsList.push({ id: "ushape", name: "U-Shape", maxCapacity: formLayoutUshapeCap });
			}
			if (formLayoutClassroomEnabled) {
				roomLayoutsList.push({ id: "classroom", name: "Classroom", maxCapacity: formLayoutClassroomCap });
			}
		}

		setFormLoading(true);
		setFormError(null);

		try {
			await saveAssetFn({
				data: {
					id: formId,
					name: formName,
					type: formType,
					location: formLocation,
					capacity: formCapacity,
					roomLayouts: formType === "room" ? roomLayoutsList : null,
					facilities: formFacilities,
					status: formStatus,
				},
			});
			setShowForm(false);
			fetchAssets();
		} catch (err: any) {
			setFormError(err.message || "Gagal menyimpan data aset.");
		} finally {
			setFormLoading(false);
		}
	};

	const handleOpenArchive = (asset: Asset) => {
		setArchiveTarget(asset);
		setShowArchiveConfirm(true);
	};

	const handleArchive = async () => {
		if (!archiveTarget) return;
		setFormLoading(true);
		try {
			await archiveAssetFn({ data: archiveTarget.id });
			setShowArchiveConfirm(false);
			setArchiveTarget(null);
			fetchAssets();
		} catch (err: any) {
			alert("Gagal mengarsipkan aset.");
		} finally {
			setFormLoading(false);
		}
	};

	// Availability Schedule Modals
	const handleOpenSchedules = async (asset: Asset) => {
		setScheduleAsset(asset);
		setAvailList([]);
		setClosuresList([]);
		setScheduleError(null);
		setShowScheduleModal(true);
		setScheduleLoading(true);

		try {
			const data = await getAssetSchedulesFn({ data: asset.id });
			setAvailList(
				data.availability.map((a: any) => ({
					dayOfWeek: a.dayOfWeek,
					openTime: a.openTime,
					closeTime: a.closeTime,
				})),
			);
			setClosuresList(
				data.closures.map((c: any) => ({
					date: c.date,
				})),
			);
		} catch (err: any) {
			setScheduleError("Gagal memuat jadwal operasional aset.");
		} finally {
			setScheduleLoading(false);
		}
	};

	const handleAddAvailability = () => {
		if (newOpen >= newClose) {
			setScheduleError("Jam buka harus lebih awal dari jam tutup.");
			return;
		}
		setScheduleError(null);
		setAvailList((prev) => [
			...prev,
			{ dayOfWeek: newDay, openTime: newOpen, closeTime: newClose },
		]);
	};

	const handleRemoveAvailability = (index: number) => {
		setAvailList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleAddClosure = () => {
		if (!newClosureDate) return;
		if (closuresList.some((c) => c.date === newClosureDate)) return;
		setClosuresList((prev) => [...prev, { date: newClosureDate }]);
	};

	const handleRemoveClosure = (index: number) => {
		setClosuresList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSaveSchedules = async () => {
		if (!scheduleAsset) return;
		setScheduleLoading(true);
		setScheduleError(null);
		try {
			await saveAssetSchedulesFn({
				data: {
					assetId: scheduleAsset.id,
					availability: availList,
					closures: closuresList,
				},
			});
			setShowScheduleModal(false);
		} catch (err: any) {
			setScheduleError(err.message || "Gagal menyimpan jadwal.");
		} finally {
			setScheduleLoading(false);
		}
	};

	// Pagination details
	const totalItems = assetsList.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
	const paginatedAssets = assetsList.slice(startIndex, endIndex);

	const getAssetTypeBadge = (type: string) => {
		const label = ASSET_TYPE_LABELS[type as AssetType] || type;
		const colorClasses: Record<string, string> = {
			room: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
			dormitory: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
			vehicle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
			field: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
			equipment: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
		};
		return (
			<span
				className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${colorClasses[type] || "bg-muted text-muted-foreground border-border"}`}
			>
				{label}
			</span>
		);
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center bg-background">
				<div className="text-sm font-medium text-muted-foreground animate-pulse">
					Memuat daftar aset...
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Kelola Fasilitas & Aset
					</h2>
					<p className="text-xs text-muted-foreground">
						Kelola ruangan, asrama, kendaraan, lapangan, peralatan, jadwal
						operasional, dan hari libur
					</p>
				</div>
				{(currentUser as any)?.role !== "pimpinan" && (
					<button
						onClick={handleOpenCreate}
						className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-md text-xs font-semibold shadow-xs outline-none transition-opacity cursor-pointer"
					>
						<Plus size={16} />
						<span>Tambah Aset</span>
					</button>
				)}
			</div>

			{error && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-3">
					<AlertCircle size={20} />
					<span>{error}</span>
					<button
						onClick={fetchAssets}
						className="ml-auto underline font-medium cursor-pointer"
					>
						Coba Lagi
					</button>
				</div>
			)}

			{/* Assets Table */}
			<div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
								<th className="p-4">Nama Fasilitas / Aset</th>
								<th className="p-4">Tipe Fasilitas</th>
								<th className="p-4">Lokasi</th>
								<th className="p-4">Kapasitas</th>
								<th className="p-4">Status</th>
								<th className="p-4 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border text-sm">
							{paginatedAssets.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="p-12 text-center flex flex-col gap-2 justify-center items-center"
									>
										<h3 className="font-semibold text-lg text-foreground">
											Belum ada fasilitas / aset
										</h3>
										<p className="text-xs text-muted-foreground">
											Tambahkan ruangan, asrama, kendaraan, lapangan, atau
											peralatan untuk mulai mengelola peminjaman.
										</p>
									</td>
								</tr>
							) : (
								paginatedAssets.map((asset) => (
									<tr key={asset.id} className="hover:bg-muted/30 transition-colors">
										<td className="p-4 font-medium text-foreground">
											<div className="flex flex-col gap-1">
												<span>{asset.name}</span>
												{(() => {
													const facs = getAssetFacilities(asset);
													const isCustom = Boolean(
														asset.facilities && asset.facilities.length > 0,
													);
													return (
														<div className="flex flex-wrap gap-1 items-center">
															{facs.slice(0, 3).map((f) => (
																<span
																	key={f}
																	className={`px-1.5 py-0.5 text-[9px] rounded font-medium border ${
																		isCustom
																			? "bg-primary/10 text-primary border-primary/20"
																			: "bg-muted text-muted-foreground border-border"
																	}`}
																>
																	{f}
																</span>
															))}
															{facs.length > 3 && (
																<span className="text-[9px] text-muted-foreground font-mono">
																	+{facs.length - 3} lainnya
																</span>
															)}
														</div>
													);
												})()}
											</div>
										</td>
										<td className="p-4">{getAssetTypeBadge(asset.type)}</td>
										<td className="p-4 text-muted-foreground">
											{asset.location || "—"}
										</td>
										<td className="p-4 text-foreground">
											<div className="flex flex-col">
												<span className="font-semibold">{asset.capacity} pax/unit</span>
												{asset.type === "room" && (
													asset.roomLayouts && asset.roomLayouts.length > 0 ? (
														<span className="text-[10px] text-muted-foreground font-mono">
															{asset.roomLayouts.map((l) => `${l.name}: ${l.maxCapacity}`).join(" • ")}
														</span>
													) : asset.roomLayouts !== undefined && asset.roomLayouts !== null ? (
														<span className="text-[10px] text-muted-foreground/70 italic">
															Kapasitas tetap (tanpa tata letak)
														</span>
													) : null
												)}
											</div>
										</td>
										<td className="p-4">
											<span
												className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${
													asset.status === "active"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
														: asset.status === "inactive"
															? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
															: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
												}`}
											>
												{asset.status === "active"
													? "Aktif"
													: asset.status === "inactive"
														? "Nonaktif"
														: "Diarsipkan"}
											</span>
										</td>
										<td className="p-4 text-right">
											{(currentUser as any)?.role !== "pimpinan" &&
												asset.status !== "archived" && (
													<div className="flex items-center justify-end gap-1.5">
														<button
															onClick={() => handleOpenSchedules(asset)}
															title="Atur Jadwal Operasional & Hari Libur"
															className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
														>
															<Calendar size={16} />
														</button>
														<button
															onClick={() => handleOpenEdit(asset)}
															title="Edit Data Aset"
															className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
														>
															<Edit2 size={16} />
														</button>
														<button
															onClick={() => handleOpenArchive(asset)}
															title="Arsipkan Aset"
															className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
														>
															<Archive size={16} />
														</button>
													</div>
												)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/40">
					<span>
						Menampilkan {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} dari
						total {totalItems} aset
					</span>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
							disabled={currentPage === 1}
							className="px-3 py-1.5 border border-border bg-card text-foreground rounded-md font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							Sebelumnya
						</button>
						<button
							onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
							disabled={currentPage === totalPages}
							className="px-3 py-1.5 border border-border bg-card text-foreground rounded-md font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							Selanjutnya
						</button>
					</div>
				</div>
			</div>

			{/* Asset Create/Edit Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
					<form
						onSubmit={handleSaveAsset}
						className="w-full max-w-[520px] max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 text-foreground overflow-hidden my-auto"
					>
						{/* Modal Header (Sticky) */}
						<div className="flex items-center justify-between border-b border-border p-5 pb-4 shrink-0 bg-card">
							<h3 className="text-base font-bold text-foreground">
								{formId ? "Edit Aset / Fasilitas" : "Tambah Aset Baru"}
							</h3>
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
							>
								<X size={18} />
							</button>
						</div>

						{/* Modal Scrollable Body */}
						<div className="p-6 overflow-y-auto flex flex-col gap-4 flex-1">
							{formError && (
								<div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
									{formError}
								</div>
							)}

							<div className="flex flex-col gap-1">
								<label
									htmlFor="assetName"
									className="text-xs font-medium text-muted-foreground"
								>
									Nama Fasilitas / Aset
								</label>
								<input
									id="assetName"
									type="text"
									disabled={formLoading}
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									placeholder="contoh: Ruang Rapat Garuda / Mobil Avanza Dinas / Lapangan Futsal"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label
									htmlFor="assetType"
									className="text-xs font-medium text-muted-foreground"
								>
									Tipe Fasilitas
								</label>
								<select
									id="assetType"
									disabled={formLoading}
									value={formType}
									onChange={(e) => setFormType(e.target.value)}
									className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium cursor-pointer"
								>
									{ASSET_TYPES.map((t) => (
										<option key={t} value={t}>
											{ASSET_TYPE_LABELS[t]} ({t.toUpperCase()})
										</option>
									))}
								</select>
							</div>

							<div className="flex flex-col gap-1">
								<label
									htmlFor="assetLocation"
									className="text-xs font-medium text-muted-foreground"
								>
									Lokasi / Penempatan
								</label>
								<input
									id="assetLocation"
									type="text"
									disabled={formLoading}
									value={formLocation}
									onChange={(e) => setFormLocation(e.target.value)}
									className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									placeholder="contoh: Gedung Utama Lantai 2 / Garasi Kendaraan"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label
									htmlFor="assetCapacity"
									className="text-xs font-medium text-muted-foreground"
								>
									Kapasitas Dasar / Maksimal (Pax)
								</label>
								<input
									id="assetCapacity"
									type="number"
									disabled={formLoading}
									value={formCapacity}
									onChange={(e) => handleCapacityChange(Number(e.target.value))}
									className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									min={1}
								/>
							</div>

							{formType === "room" && (
								<div className="p-3.5 bg-muted/40 border border-border rounded-lg flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<label className="text-xs font-bold text-foreground flex items-center gap-1.5">
											<span>Tata Letak Ruangan (Layout & Kapasitas)</span>
										</label>
										<span className="text-[10px] text-muted-foreground font-mono">Opsional</span>
									</div>
									<p className="text-[11px] text-muted-foreground leading-tight">
										Aktifkan opsi tata letak jika ruangan dapat diatur konfigurasinya. Jika seluruh opsi dinonaktifkan, ruangan akan menggunakan kapasitas dasar tanpa pilihan tata letak (misal: Ruang Studio/Lab).
									</p>

									{/* Island */}
									<div className="flex items-center justify-between gap-3 bg-card p-2.5 rounded-md border border-border">
										<label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
											<input
												type="checkbox"
												checked={formLayoutIslandEnabled}
												onChange={(e) => setFormLayoutIslandEnabled(e.target.checked)}
												className="rounded border-border text-primary focus:ring-primary"
											/>
											<span>🌴 Island</span>
										</label>
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] text-muted-foreground">Maks:</span>
											<input
												type="number"
												min={1}
												disabled={!formLayoutIslandEnabled || formLoading}
												value={formLayoutIslandCap}
												onChange={(e) => setFormLayoutIslandCap(Math.max(1, Number(e.target.value)))}
												className="w-16 px-2 py-1 text-xs bg-background text-foreground border border-border rounded text-right disabled:opacity-40"
											/>
											<span className="text-[10px] text-muted-foreground">Pax</span>
										</div>
									</div>

									{/* U-Shape */}
									<div className="flex items-center justify-between gap-3 bg-card p-2.5 rounded-md border border-border">
										<label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
											<input
												type="checkbox"
												checked={formLayoutUshapeEnabled}
												onChange={(e) => setFormLayoutUshapeEnabled(e.target.checked)}
												className="rounded border-border text-primary focus:ring-primary"
											/>
											<span>🔲 U-Shape</span>
										</label>
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] text-muted-foreground">Maks:</span>
											<input
												type="number"
												min={1}
												disabled={!formLayoutUshapeEnabled || formLoading}
												value={formLayoutUshapeCap}
												onChange={(e) => setFormLayoutUshapeCap(Math.max(1, Number(e.target.value)))}
												className="w-16 px-2 py-1 text-xs bg-background text-foreground border border-border rounded text-right disabled:opacity-40"
											/>
											<span className="text-[10px] text-muted-foreground">Pax</span>
										</div>
									</div>

									{/* Classroom */}
									<div className="flex items-center justify-between gap-3 bg-card p-2.5 rounded-md border border-border">
										<label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-foreground">
											<input
												type="checkbox"
												checked={formLayoutClassroomEnabled}
												onChange={(e) => setFormLayoutClassroomEnabled(e.target.checked)}
												className="rounded border-border text-primary focus:ring-primary"
											/>
											<span>🎓 Classroom</span>
										</label>
										<div className="flex items-center gap-1.5">
											<span className="text-[10px] text-muted-foreground">Maks:</span>
											<input
												type="number"
												min={1}
												disabled={!formLayoutClassroomEnabled || formLoading}
												value={formLayoutClassroomCap}
												onChange={(e) => setFormLayoutClassroomCap(Math.max(1, Number(e.target.value)))}
												className="w-16 px-2 py-1 text-xs bg-background text-foreground border border-border rounded text-right disabled:opacity-40"
											/>
											<span className="text-[10px] text-muted-foreground">Pax</span>
										</div>
									</div>
								</div>
							)}

							{/* Facilities & Amenities Tags Editor */}
							<div className="p-3.5 bg-muted/40 border border-border rounded-lg flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<label className="text-xs font-bold text-foreground flex items-center gap-1.5">
										<Tag size={14} className="text-primary" />
										<span>Fasilitas & Kelengkapan (Tags/Badges)</span>
									</label>
									<span className="text-[10px] text-muted-foreground font-mono">
										{formFacilities.length}/20 Tag
									</span>
								</div>
								<p className="text-[11px] text-muted-foreground leading-tight">
									Pilih rekomendasi fasilitas untuk tipe {ASSET_TYPE_LABELS[formType as AssetType] || formType} atau ketik tag kustom (misal: "Smart TV 75\"", "Wi-Fi Cepat", "Kamar Mandi Dalam").
								</p>

								{/* Active Tags */}
								<div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-background border border-border rounded-md items-center">
									{formFacilities.length === 0 ? (
										<span className="text-xs text-muted-foreground/60 italic">
											Belum ada fasilitas kustom (akan menggunakan fasilitas default kategori).
										</span>
									) : (
										formFacilities.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-md animate-in fade-in zoom-in-95 duration-100"
											>
												{tag}
												<button
													type="button"
													onClick={() => handleRemoveTag(tag)}
													className="hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors cursor-pointer"
													title={`Hapus tag ${tag}`}
												>
													<X size={12} />
												</button>
											</span>
										))
									)}
								</div>

								{/* Category Preset Quick Suggestions */}
								{CATEGORY_FACILITY_PRESETS[formType as AssetType] && (
									<div className="flex flex-col gap-1.5">
										<div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
											<Sparkles size={12} className="text-amber-500" />
											<span>Rekomendasi Cepat ({ASSET_TYPE_LABELS[formType as AssetType]}):</span>
										</div>
										<div className="flex flex-wrap gap-1.5">
											{CATEGORY_FACILITY_PRESETS[formType as AssetType].map((preset) => {
												const isSelected = formFacilities.some(
													(t) => t.toLowerCase() === preset.toLowerCase(),
												);
												return (
													<button
														key={preset}
														type="button"
														onClick={() => handleTogglePreset(preset)}
														className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border transition-colors cursor-pointer ${
															isSelected
																? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs"
																: "bg-background text-foreground border-border hover:bg-muted"
														}`}
													>
														{isSelected && <Check size={10} />}
														<span>{preset}</span>
													</button>
												);
											})}
										</div>
									</div>
								)}

								{/* Custom Tag Input */}
								<div className="flex gap-2 items-center pt-1">
									<input
										type="text"
										disabled={formLoading || formFacilities.length >= 20}
										value={customTagInput}
										onChange={(e) => setCustomTagInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddTag(customTagInput);
											}
										}}
										placeholder={
											formFacilities.length >= 20
												? "Maksimal 20 tag tercapai"
												: "Ketik tag kustom & tekan Enter..."
										}
										className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
									<button
										type="button"
										disabled={formLoading || !customTagInput.trim() || formFacilities.length >= 20}
										onClick={() => handleAddTag(customTagInput)}
										className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md hover:bg-secondary/80 disabled:opacity-40 cursor-pointer"
									>
										Tambah
									</button>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<label
									htmlFor="assetStatus"
									className="text-xs font-medium text-muted-foreground"
								>
									Status
								</label>
								<select
									id="assetStatus"
									disabled={formLoading}
									value={formStatus}
									onChange={(e) => setFormStatus(e.target.value)}
									className="px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
								>
									<option value="active">Aktif (Dapat Dipinjam)</option>
									<option value="inactive">Nonaktif (Pemeliharaan)</option>
								</select>
							</div>
						</div>

						{/* Modal Footer (Sticky) */}
						<div className="flex gap-3 justify-end border-t border-border p-4 px-6 bg-muted/30 shrink-0">
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="px-3.5 py-2 border border-border bg-card text-foreground text-xs font-medium rounded-md hover:bg-muted cursor-pointer"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={formLoading}
								className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
							>
								{formLoading ? "Menyimpan..." : "Simpan Aset"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Availability & Closures Modal */}
			{showScheduleModal && scheduleAsset && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
					<div className="w-full max-w-[600px] max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 text-foreground overflow-hidden my-auto">
						{/* Schedule Header (Sticky) */}
						<div className="flex items-center justify-between border-b border-border p-5 pb-4 shrink-0 bg-card">
							<div className="flex flex-col">
								<h3 className="text-base font-bold text-foreground">
									Konfigurasi Jadwal & Hari Libur
								</h3>
								<p className="text-xs text-muted-foreground font-medium">
									{scheduleAsset.name}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowScheduleModal(false)}
								className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
							>
								<X size={18} />
							</button>
						</div>

						{/* Schedule Body (Scrollable) */}
						<div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
							{scheduleError && (
								<div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
									{scheduleError}
								</div>
							)}

							{/* Weekly Availability Sections */}
							<div className="flex flex-col gap-3">
								<h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
									<Clock size={16} className="text-primary" />
									<span>Jadwal Operasional Mingguan (WIB)</span>
								</h4>

								{/* Add availability form */}
								<div className="grid grid-cols-4 gap-2 items-end p-3 bg-muted/40 border border-border rounded-lg">
									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-medium text-muted-foreground">
											Hari
										</label>
										<select
											value={newDay}
											onChange={(e) => setNewDay(Number(e.target.value))}
											className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
										>
											{DAYS_ID.map((d, i) => (
												<option key={i} value={i}>
													{d}
												</option>
											))}
										</select>
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-medium text-muted-foreground">
											Jam Buka
										</label>
										<input
											type="time"
											value={newOpen}
											onChange={(e) => setNewOpen(e.target.value)}
											className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
										/>
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-medium text-muted-foreground">
											Jam Tutup
										</label>
										<input
											type="time"
											value={newClose}
											onChange={(e) => setNewClose(e.target.value)}
											className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
										/>
									</div>
									<button
										type="button"
										onClick={handleAddAvailability}
										className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded text-xs font-semibold cursor-pointer shadow-xs"
									>
										Tambah
									</button>
								</div>

								{/* Schedule list */}
								<div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
									{availList.length === 0 ? (
										<div className="p-3 text-center text-xs text-muted-foreground">
											Belum ada jadwal operasional khusus (terbuka 24 jam /
											bebas).
										</div>
									) : (
										availList.map((slot, index) => (
											<div
												key={index}
												className="flex justify-between items-center p-2.5 text-xs hover:bg-muted/20"
											>
												<span className="font-medium text-foreground">
													{DAYS_ID[slot.dayOfWeek]}
												</span>
												<span className="text-muted-foreground font-mono">
													{slot.openTime} - {slot.closeTime} WIB
												</span>
												<button
													onClick={() => handleRemoveAvailability(index)}
													className="text-destructive hover:bg-destructive/10 px-2 py-0.5 rounded text-[11px] cursor-pointer"
												>
													Hapus
												</button>
											</div>
										))
									)}
								</div>
							</div>

							{/* Date-specific Closures Section */}
							<div className="flex flex-col gap-3 border-t border-border pt-4">
								<h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
									<Calendar size={16} className="text-amber-500" />
									<span>Penutupan Khusus / Hari Libur / Pemeliharaan</span>
								</h4>

								{/* Add closure form */}
								<div className="grid grid-cols-4 gap-2 items-end p-3 bg-muted/40 border border-border rounded-lg">
									<div className="col-span-3 flex flex-col gap-1">
										<label className="text-[10px] font-medium text-muted-foreground">
											Tanggal Penutupan
										</label>
										<input
											type="date"
											value={newClosureDate}
											onChange={(e) => setNewClosureDate(e.target.value)}
											className="px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground outline-none w-full"
										/>
									</div>
									<button
										type="button"
										onClick={handleAddClosure}
										className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded text-xs font-semibold h-[32px] flex items-center justify-center cursor-pointer shadow-xs"
									>
										Tambah
									</button>
								</div>

								{/* Closures list */}
								<div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
									{closuresList.length === 0 ? (
										<div className="p-3 text-center text-xs text-muted-foreground">
											Tidak ada tanggal penutupan khusus.
										</div>
									) : (
										closuresList.map((closure, index) => (
											<div
												key={index}
												className="flex justify-between items-center p-2.5 text-xs hover:bg-muted/20"
											>
												<span className="font-mono font-medium text-foreground">
													{closure.date}
												</span>
												<button
													onClick={() => handleRemoveClosure(index)}
													className="text-destructive hover:bg-destructive/10 px-2 py-0.5 rounded text-[11px] cursor-pointer"
												>
													Hapus
												</button>
											</div>
										))
									)}
								</div>
							</div>
						</div>

						{/* Schedule Footer (Sticky) */}
						<div className="flex gap-3 justify-end border-t border-border p-4 px-6 bg-muted/30 shrink-0">
							<button
								type="button"
								onClick={() => setShowScheduleModal(false)}
								disabled={scheduleLoading}
								className="px-3.5 py-2 border border-border bg-card text-foreground text-xs font-medium rounded-md hover:bg-muted cursor-pointer"
							>
								Batal
							</button>
							<button
								onClick={handleSaveSchedules}
								disabled={scheduleLoading}
								className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
							>
								{scheduleLoading ? "Menyimpan..." : "Simpan Jadwal"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Archive Confirmation Dialog */}
			{showArchiveConfirm && archiveTarget && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-[450px] bg-card border border-border rounded-xl shadow-xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 text-foreground">
						<div className="flex flex-col gap-2">
							<h3 className="text-base font-bold text-destructive">
								Arsipkan Fasilitas / Aset
							</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Apakah Anda yakin ingin mengarsipkan aset{" "}
								<strong className="text-foreground">"{archiveTarget.name}"</strong>? Aset tidak akan muncul
								lagi di katalog peminjaman publik, namun seluruh riwayat
								peminjaman dan log audit tetap tersimpan aman.
							</p>
						</div>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => {
									setShowArchiveConfirm(false);
									setArchiveTarget(null);
								}}
								disabled={formLoading}
								className="px-3.5 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-medium rounded-md transition-colors disabled:opacity-50 cursor-pointer"
							>
								Batal
							</button>
							<button
								onClick={handleArchive}
								disabled={formLoading}
								className="px-3.5 py-2 bg-destructive text-destructive-foreground hover:opacity-90 text-xs font-semibold rounded-md transition-opacity disabled:opacity-50 cursor-pointer"
							>
								{formLoading ? "Mengarsipkan..." : "Ya, Arsipkan"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
