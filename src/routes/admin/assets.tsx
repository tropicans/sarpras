import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Archive,
	Calendar,
	Clock,
	Edit2,
	Plus,
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
	const [formCapacity, setFormCapacity] = useState(1);
	const [formStatus, setFormStatus] = useState("active");
	const [formError, setFormError] = useState<string | null>(null);
	const [formLoading, setFormLoading] = useState(false);

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
		setFormCapacity(1);
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
		setFormStatus(asset.status);
		setFormError(null);
		setShowForm(true);
	};

	const handleSaveAsset = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formName || formCapacity <= 0) {
			setFormError("Nama aset dan kapasitas (minimal 1) wajib diisi.");
			return;
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
			room: "bg-blue-50 text-blue-700 border-blue-200",
			dormitory: "bg-purple-50 text-purple-700 border-purple-200",
			vehicle: "bg-emerald-50 text-emerald-700 border-emerald-200",
			field: "bg-amber-50 text-amber-700 border-amber-200",
			equipment: "bg-slate-100 text-slate-700 border-slate-200",
		};
		return (
			<span
				className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${colorClasses[type] || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}
			>
				{label}
			</span>
		);
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center bg-white">
				<div className="text-sm font-medium text-[#71717a] animate-pulse">
					Memuat daftar aset...
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-[#09090b]">
						Kelola Fasilitas & Aset
					</h2>
					<p className="text-xs text-[#71717a]">
						Kelola ruangan, asrama, kendaraan, lapangan, peralatan, jadwal
						operasional, dan hari libur
					</p>
				</div>
				{(currentUser as any)?.role !== "pimpinan" && (
					<button
						onClick={handleOpenCreate}
						className="flex items-center gap-2 px-3 py-2 bg-[#09090b] text-white hover:bg-[#27272a] rounded-md text-xs font-semibold shadow-sm outline-none transition-colors"
					>
						<Plus size={16} />
						<span>Tambah Aset</span>
					</button>
				)}
			</div>

			{error && (
				<div className="p-4 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-sm rounded-lg flex items-center gap-3">
					<AlertCircle size={20} />
					<span>{error}</span>
					<button
						onClick={fetchAssets}
						className="ml-auto underline font-medium"
					>
						Coba Lagi
					</button>
				</div>
			)}

			{/* Assets Table */}
			<div className="border border-[#e4e4e7] rounded-xl overflow-hidden shadow-sm bg-white">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-[#fafafa] border-b border-[#e4e4e7] text-xs font-semibold text-[#71717a]">
								<th className="p-4">Nama Fasilitas / Aset</th>
								<th className="p-4">Tipe Fasilitas</th>
								<th className="p-4">Lokasi</th>
								<th className="p-4">Kapasitas</th>
								<th className="p-4">Status</th>
								<th className="p-4 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e4e4e7] text-sm">
							{paginatedAssets.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="p-12 text-center flex flex-col gap-2 justify-center items-center"
									>
										<h3 className="font-semibold text-lg text-[#09090b]">
											Belum ada fasilitas / aset
										</h3>
										<p className="text-xs text-[#71717a]">
											Tambahkan ruangan, asrama, kendaraan, lapangan, atau
											peralatan untuk mulai mengelola peminjaman.
										</p>
									</td>
								</tr>
							) : (
								paginatedAssets.map((asset) => (
									<tr key={asset.id} className="hover:bg-[#fafafa]">
										<td className="p-4 font-medium text-[#09090b]">
											{asset.name}
										</td>
										<td className="p-4">{getAssetTypeBadge(asset.type)}</td>
										<td className="p-4 text-[#71717a]">
											{asset.location || "—"}
										</td>
										<td className="p-4 text-[#09090b] font-medium">
											{asset.capacity} pax/unit
										</td>
										<td className="p-4">
											<span
												className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
													asset.status === "active"
														? "bg-[#ecfdf5] text-[#059669]"
														: asset.status === "inactive"
															? "bg-[#fffbeb] text-[#d97706]"
															: "bg-[#fef2f2] text-[#e11d48]"
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
															className="p-2 text-[#71717a] hover:text-[#09090b] hover:bg-[#e4e4e7] rounded-md transition-colors"
														>
															<Calendar size={16} />
														</button>
														<button
															onClick={() => handleOpenEdit(asset)}
															title="Edit Data Aset"
															className="p-2 text-[#71717a] hover:text-[#09090b] hover:bg-[#e4e4e7] rounded-md transition-colors"
														>
															<Edit2 size={16} />
														</button>
														<button
															onClick={() => handleOpenArchive(asset)}
															title="Arsipkan Aset"
															className="p-2 text-[#71717a] hover:text-[#e11d48] hover:bg-[#fef2f2] rounded-md transition-colors"
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
				<div className="p-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#71717a] bg-[#fafafa]">
					<span>
						Menampilkan {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} dari
						total {totalItems} aset
					</span>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
							disabled={currentPage === 1}
							className="px-3 py-1.5 border border-[#e4e4e7] bg-white rounded-md font-medium hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Sebelumnya
						</button>
						<button
							onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
							disabled={currentPage === totalPages}
							className="px-3 py-1.5 border border-[#e4e4e7] bg-white rounded-md font-medium hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Selanjutnya
						</button>
					</div>
				</div>
			</div>

			{/* Asset Create/Edit Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
					<form
						onSubmit={handleSaveAsset}
						className="w-full max-w-[450px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
					>
						<div className="flex items-center justify-between border-b border-[#e4e4e7] pb-3">
							<h3 className="text-base font-bold text-[#09090b]">
								{formId ? "Edit Aset / Fasilitas" : "Tambah Aset Baru"}
							</h3>
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="text-[#71717a] hover:text-[#09090b]"
							>
								<X size={18} />
							</button>
						</div>

						{formError && (
							<div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-md">
								{formError}
							</div>
						)}

						<div className="flex flex-col gap-1">
							<label
								htmlFor="assetName"
								className="text-xs font-medium text-[#71717a]"
							>
								Nama Fasilitas / Aset
							</label>
							<input
								id="assetName"
								type="text"
								disabled={formLoading}
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
								placeholder="contoh: Ruang Rapat Garuda / Mobil Avanza Dinas / Lapangan Futsal"
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="assetType"
								className="text-xs font-medium text-[#71717a]"
							>
								Tipe Fasilitas
							</label>
							<select
								id="assetType"
								disabled={formLoading}
								value={formType}
								onChange={(e) => setFormType(e.target.value)}
								className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent font-medium"
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
								className="text-xs font-medium text-[#71717a]"
							>
								Lokasi / Penempatan
							</label>
							<input
								id="assetLocation"
								type="text"
								disabled={formLoading}
								value={formLocation}
								onChange={(e) => setFormLocation(e.target.value)}
								className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
								placeholder="contoh: Gedung Utama Lantai 2 / Garasi Kendaraan"
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="assetCapacity"
								className="text-xs font-medium text-[#71717a]"
							>
								Kapasitas (Pax / Orang / Unit)
							</label>
							<input
								id="assetCapacity"
								type="number"
								disabled={formLoading}
								value={formCapacity}
								onChange={(e) => setFormCapacity(Number(e.target.value))}
								className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
								min={1}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="assetStatus"
								className="text-xs font-medium text-[#71717a]"
							>
								Status
							</label>
							<select
								id="assetStatus"
								disabled={formLoading}
								value={formStatus}
								onChange={(e) => setFormStatus(e.target.value)}
								className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
							>
								<option value="active">Aktif (Dapat Dipinjam)</option>
								<option value="inactive">Nonaktif (Pemeliharaan)</option>
							</select>
						</div>

						<div className="flex gap-3 justify-end border-t border-[#e4e4e7] pt-3 mt-2">
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="px-3 py-1.5 border border-[#e4e4e7] bg-white text-xs font-medium rounded-md hover:bg-[#fafafa]"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={formLoading}
								className="px-3 py-1.5 bg-[#09090b] text-white text-xs font-medium rounded-md hover:bg-[#27272a] disabled:opacity-50"
							>
								{formLoading ? "Menyimpan..." : "Simpan Aset"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Availability & Closures Modal */}
			{showScheduleModal && scheduleAsset && (
				<div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-[600px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
						<div className="flex items-center justify-between border-b border-[#e4e4e7] pb-3">
							<div className="flex flex-col">
								<h3 className="text-base font-bold text-[#09090b]">
									Konfigurasi Jadwal & Hari Libur
								</h3>
								<p className="text-xs text-[#71717a] font-medium">
									{scheduleAsset.name}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowScheduleModal(false)}
								className="text-[#71717a] hover:text-[#09090b]"
							>
								<X size={18} />
							</button>
						</div>

						{scheduleError && (
							<div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-md">
								{scheduleError}
							</div>
						)}

						{/* Weekly Availability Sections */}
						<div className="flex flex-col gap-3">
							<h4 className="font-semibold text-xs text-[#09090b] flex items-center gap-2">
								<Clock size={16} />
								<span>Jadwal Operasional Mingguan (WIB)</span>
							</h4>

							{/* Add availability form */}
							<div className="grid grid-cols-4 gap-2 items-end p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-medium text-[#71717a]">
										Hari
									</label>
									<select
										value={newDay}
										onChange={(e) => setNewDay(Number(e.target.value))}
										className="px-2 py-1 border border-[#e4e4e7] rounded text-xs bg-white"
									>
										{DAYS_ID.map((d, i) => (
											<option key={i} value={i}>
												{d}
											</option>
										))}
									</select>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-medium text-[#71717a]">
										Jam Buka
									</label>
									<input
										type="time"
										value={newOpen}
										onChange={(e) => setNewOpen(e.target.value)}
										className="px-2 py-1 border border-[#e4e4e7] rounded text-xs"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-medium text-[#71717a]">
										Jam Tutup
									</label>
									<input
										type="time"
										value={newClose}
										onChange={(e) => setNewClose(e.target.value)}
										className="px-2 py-1 border border-[#e4e4e7] rounded text-xs"
									/>
								</div>
								<button
									type="button"
									onClick={handleAddAvailability}
									className="px-3 py-1.5 bg-[#09090b] text-white hover:bg-[#27272a] rounded text-xs font-semibold"
								>
									Tambah
								</button>
							</div>

							{/* Schedule list */}
							<div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-[#e4e4e7] rounded-lg divide-y divide-[#e4e4e7]">
								{availList.length === 0 ? (
									<div className="p-3 text-center text-xs text-[#71717a]">
										Belum ada jadwal operasional khusus (terbuka 24 jam /
										bebas).
									</div>
								) : (
									availList.map((slot, index) => (
										<div
											key={index}
											className="flex justify-between items-center p-2.5 text-xs"
										>
											<span className="font-medium">
												{DAYS_ID[slot.dayOfWeek]}
											</span>
											<span className="text-[#71717a] font-mono">
												{slot.openTime} - {slot.closeTime} WIB
											</span>
											<button
												onClick={() => handleRemoveAvailability(index)}
												className="text-[#e11d48] hover:bg-[#fef2f2] px-2 py-0.5 rounded text-[11px]"
											>
												Hapus
											</button>
										</div>
									))
								)}
							</div>
						</div>

						{/* Date-specific Closures Section */}
						<div className="flex flex-col gap-3 border-t border-[#e4e4e7] pt-4">
							<h4 className="font-semibold text-xs text-[#09090b] flex items-center gap-2">
								<Calendar size={16} />
								<span>Penutupan Khusus / Hari Libur / Pemeliharaan</span>
							</h4>

							{/* Add closure form */}
							<div className="grid grid-cols-4 gap-2 items-end p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
								<div className="col-span-3 flex flex-col gap-1">
									<label className="text-[10px] font-medium text-[#71717a]">
										Tanggal Penutupan
									</label>
									<input
										type="date"
										value={newClosureDate}
										onChange={(e) => setNewClosureDate(e.target.value)}
										className="px-2 py-1.5 border border-[#e4e4e7] rounded text-xs bg-white outline-none w-full"
									/>
								</div>
								<button
									type="button"
									onClick={handleAddClosure}
									className="px-3 py-1.5 bg-[#09090b] text-white hover:bg-[#27272a] rounded text-xs font-semibold h-[32px] flex items-center justify-center"
								>
									Tambah
								</button>
							</div>

							{/* Closures list */}
							<div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-[#e4e4e7] rounded-lg divide-y divide-[#e4e4e7]">
								{closuresList.length === 0 ? (
									<div className="p-3 text-center text-xs text-[#71717a]">
										Tidak ada tanggal penutupan khusus.
									</div>
								) : (
									closuresList.map((closure, index) => (
										<div
											key={index}
											className="flex justify-between items-center p-2.5 text-xs"
										>
											<span className="font-mono font-medium">
												{closure.date}
											</span>
											<button
												onClick={() => handleRemoveClosure(index)}
												className="text-[#e11d48] hover:bg-[#fef2f2] px-2 py-0.5 rounded text-[11px]"
											>
												Hapus
											</button>
										</div>
									))
								)}
							</div>
						</div>

						<div className="flex gap-3 justify-end border-t border-[#e4e4e7] pt-3 mt-2">
							<button
								type="button"
								onClick={() => setShowScheduleModal(false)}
								disabled={scheduleLoading}
								className="px-3 py-1.5 border border-[#e4e4e7] bg-white text-xs font-medium rounded-md hover:bg-[#fafafa]"
							>
								Batal
							</button>
							<button
								onClick={handleSaveSchedules}
								disabled={scheduleLoading}
								className="px-3 py-1.5 bg-[#09090b] text-white text-xs font-medium rounded-md hover:bg-[#27272a] disabled:opacity-50"
							>
								{scheduleLoading ? "Menyimpan..." : "Simpan Jadwal"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Archive Confirmation Dialog */}
			{showArchiveConfirm && archiveTarget && (
				<div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-[450px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
						<div className="flex flex-col gap-2">
							<h3 className="text-base font-bold text-[#09090b]">
								Arsipkan Fasilitas / Aset
							</h3>
							<p className="text-xs text-[#71717a] leading-relaxed">
								Apakah Anda yakin ingin mengarsipkan aset{" "}
								<strong>"{archiveTarget.name}"</strong>? Aset tidak akan muncul
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
								className="px-3 py-1.5 border border-[#e4e4e7] bg-white hover:bg-[#fafafa] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
							>
								Batal
							</button>
							<button
								onClick={handleArchive}
								disabled={formLoading}
								className="px-3 py-1.5 bg-[#e11d48] text-white hover:bg-[#be123c] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
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
