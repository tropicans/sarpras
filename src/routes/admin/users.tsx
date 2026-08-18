import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle2,
	Mail,
	Trash2,
	UserCheck,
	UserPlus,
	UserX,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	createGoogleUserFn,
	deleteUserFn,
	getAdminsListFn,
	toggleUserStatusFn,
} from "#/lib/auth/auth.functions";

export const Route = createFileRoute("/admin/users")({
	beforeLoad: ({ context }) => {
		const user = (context as any).user;
		if (!user || user.role !== "admin") {
			throw redirect({ to: "/admin" });
		}
	},
	component: AdminUsersComponent,
});

type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	createdAt: string | Date;
};

const ROLE_LABELS: Record<string, string> = {
	admin: "Administrator",
	operator: "Operator Sarpras",
	pimpinan: "Pimpinan",
};

const ROLE_COLORS: Record<string, string> = {
	admin: "bg-purple-100 text-purple-800 border-purple-200",
	operator: "bg-blue-100 text-blue-800 border-blue-200",
	pimpinan: "bg-amber-100 text-amber-800 border-amber-200",
};

function AdminUsersComponent() {
	const { user: currentUser } = Route.useRouteContext();
	const [userList, setUserList] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Add User Modal State
	const [showAddModal, setShowAddModal] = useState(false);
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newRole, setNewRole] = useState<"admin" | "operator" | "pimpinan">(
		"operator",
	);
	const [formError, setFormError] = useState<string | null>(null);

	// Deactivate/Delete Modal State
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [actionType, setActionType] = useState<
		"toggleStatus" | "delete" | null
	>(null);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const fetchUsers = () => {
		setLoading(true);
		setError(null);
		getAdminsListFn()
			.then((data) => setUserList(data as any))
			.catch(() => setError("Gagal memuat daftar pengguna."))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newName.trim() || !newEmail.trim()) {
			setFormError("Mohon lengkapi seluruh isian formulir.");
			return;
		}

		setActionLoading(true);
		setFormError(null);

		try {
			await createGoogleUserFn({
				data: {
					name: newName.trim(),
					email: newEmail.trim().toLowerCase(),
					role: newRole,
				},
			});

			setShowAddModal(false);
			setNewName("");
			setNewEmail("");
			setNewRole("operator");
			setSuccessMessage(
				`Akun Google "${newEmail.trim().toLowerCase()}" berhasil didaftarkan!`,
			);
			setTimeout(() => setSuccessMessage(null), 5000);
			fetchUsers();
		} catch (err: any) {
			setFormError(
				err?.message ||
					"Gagal mendaftarkan akun. Pastikan Anda memiliki hak akses Administrator.",
			);
		} finally {
			setActionLoading(false);
		}
	};

	const handleToggleStatus = async () => {
		if (!selectedUser) return;
		setActionLoading(true);
		try {
			const nextStatus =
				selectedUser.status === "active" ? "inactive" : "active";
			await toggleUserStatusFn({
				data: {
					userId: selectedUser.id,
					status: nextStatus,
				},
			});
			setSelectedUser(null);
			setActionType(null);
			fetchUsers();
		} catch (err: any) {
			alert(err?.message || "Gagal mengubah status akun.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteUser = async () => {
		if (!selectedUser) return;
		setActionLoading(true);
		try {
			await deleteUserFn({ data: selectedUser.id });
			setSelectedUser(null);
			setActionType(null);
			fetchUsers();
		} catch (err: any) {
			alert(err?.message || "Gagal menghapus akun pengguna.");
		} finally {
			setActionLoading(false);
		}
	};

	// Pagination
	const totalItems = userList.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
	const paginatedUsers = userList.slice(startIndex, endIndex);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center bg-white">
				<div className="text-sm font-medium text-[#71717a] animate-pulse">
					Memuat data pengguna...
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 max-w-7xl">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-[#09090b]">
						Manajemen Pengguna & Akun Google
					</h2>
					<p className="text-xs text-[#71717a]">
						Daftarkan email Google / Gmail petugas dan kelola hak akses sistem
						Sarpras
					</p>
				</div>

				{(currentUser as any)?.role === "admin" && (
					<button
						type="button"
						onClick={() => {
							setFormError(null);
							setShowAddModal(true);
						}}
						className="self-start px-4 py-2.5 bg-[#09090b] text-white text-xs font-semibold rounded-lg hover:bg-[#27272a] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<UserPlus size={16} />
						<span>Daftarkan Akun Google</span>
					</button>
				)}
			</div>

			{/* Alert Messages */}
			{successMessage && (
				<div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
					<CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
					<span>{successMessage}</span>
				</div>
			)}

			{error && (
				<div className="p-4 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-xl flex items-center gap-3">
					<AlertCircle size={18} className="shrink-0" />
					<span>{error}</span>
					<button
						onClick={fetchUsers}
						className="ml-auto underline font-medium"
					>
						Coba Lagi
					</button>
				</div>
			)}

			{/* Users Table */}
			<div className="border border-[#e4e4e7] rounded-xl overflow-hidden shadow-xs bg-white">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-[#fafafa] border-b border-[#e4e4e7] text-xs font-semibold text-[#71717a]">
								<th className="p-4">Nama Lengkap</th>
								<th className="p-4">Email Google (SSO)</th>
								<th className="p-4">Peran (Role)</th>
								<th className="p-4">Status Akses</th>
								<th className="p-4 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#e4e4e7] text-sm">
							{paginatedUsers.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="p-8 text-center text-[#71717a] text-xs"
									>
										Belum ada akun pengguna Google yang terdaftar
									</td>
								</tr>
							) : (
								paginatedUsers.map((u) => {
									const isSelf = u.id === currentUser.id;
									return (
										<tr
											key={u.id}
											className="hover:bg-[#fafafa] transition-colors"
										>
											<td className="p-4 font-semibold text-[#09090b]">
												<div className="flex items-center gap-2">
													<span>{u.name}</span>
													{isSelf && (
														<span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded">
															Anda
														</span>
													)}
												</div>
											</td>
											<td className="p-4 text-[#71717a] font-mono text-xs">
												<div className="flex items-center gap-1.5">
													<Mail size={13} className="text-zinc-400" />
													<span>{u.email}</span>
												</div>
											</td>
											<td className="p-4">
												<span
													className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md border ${ROLE_COLORS[u.role] || "bg-zinc-100 text-zinc-700"}`}
												>
													{ROLE_LABELS[u.role] || u.role}
												</span>
											</td>
											<td className="p-4">
												<span
													className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md ${
														u.status === "active"
															? "bg-emerald-50 text-emerald-700 border border-emerald-200"
															: "bg-rose-50 text-rose-700 border border-rose-200"
													}`}
												>
													<span
														className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}
													/>
													{u.status === "active" ? "Aktif" : "Nonaktif"}
												</span>
											</td>
											<td className="p-4 text-right">
												{!isSelf && (currentUser as any)?.role === "admin" && (
													<div className="flex items-center justify-end gap-1">
														<button
															type="button"
															onClick={() => {
																setSelectedUser(u);
																setActionType("toggleStatus");
															}}
															title={
																u.status === "active"
																	? "Nonaktifkan Akses Akun"
																	: "Aktifkan Kembali Akun"
															}
															className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
																u.status === "active"
																	? "text-zinc-500 hover:text-amber-700 hover:bg-amber-50"
																	: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
															}`}
														>
															{u.status === "active" ? (
																<UserX size={16} />
															) : (
																<UserCheck size={16} />
															)}
														</button>

														<button
															type="button"
															onClick={() => {
																setSelectedUser(u);
																setActionType("delete");
															}}
															title="Hapus Pengguna"
															className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
														>
															<Trash2 size={16} />
														</button>
													</div>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				<div className="p-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#71717a] bg-[#fafafa]">
					<span>
						Menampilkan {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} dari
						total {totalItems} akun
					</span>
					<div className="flex gap-2">
						<button
							onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
							disabled={currentPage === 1}
							className="px-3 py-1.5 border border-[#e4e4e7] bg-white rounded-md font-medium hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							Sebelumnya
						</button>
						<button
							onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
							disabled={currentPage === totalPages}
							className="px-3 py-1.5 border border-[#e4e4e7] bg-white rounded-md font-medium hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							Selanjutnya
						</button>
					</div>
				</div>
			</div>

			{/* MODAL: Daftarkan Akun Google Baru */}
			{showAddModal && (
				<div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
					<div className="w-full max-w-[460px] bg-white border border-[#e4e4e7] rounded-2xl shadow-xl p-6 flex flex-col gap-5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
									<UserPlus size={20} />
								</div>
								<div>
									<h3 className="text-base font-bold text-[#09090b]">
										Daftarkan Akun Google
									</h3>
									<p className="text-xs text-[#71717a]">
										Beri hak akses login Google ke sistem Sarpras
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md"
							>
								<X size={18} />
							</button>
						</div>

						{formError && (
							<div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
								<AlertCircle size={15} className="shrink-0 text-rose-600" />
								<span>{formError}</span>
							</div>
						)}

						<form onSubmit={handleCreateUser} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-[#09090b]">
									Nama Lengkap Petugas <span className="text-rose-500">*</span>
								</label>
								<input
									type="text"
									required
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="Misal: Ahmad Fauzi"
									className="px-3.5 py-2.5 border border-[#e4e4e7] rounded-xl text-xs focus:ring-2 focus:ring-[#09090b] focus:outline-none"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-[#09090b]">
									Alamat Email Google / Gmail{" "}
									<span className="text-rose-500">*</span>
								</label>
								<input
									type="email"
									required
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									placeholder="nama@gmail.com / nama@setneg.go.id"
									className="px-3.5 py-2.5 border border-[#e4e4e7] rounded-xl text-xs focus:ring-2 focus:ring-[#09090b] focus:outline-none"
								/>
								<span className="text-[11px] text-[#71717a]">
									Petugas akan login menggunakan tombol "Masuk dengan Google"
									dengan email ini.
								</span>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-[#09090b]">
									Hak Akses / Peran (Role){" "}
									<span className="text-rose-500">*</span>
								</label>
								<select
									value={newRole}
									onChange={(e) => setNewRole(e.target.value as any)}
									className="px-3.5 py-2.5 border border-[#e4e4e7] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#09090b] focus:outline-none cursor-pointer"
								>
									<option value="operator">
										Operator Sarpras (Verifikasi, Jadwal, Approval)
									</option>
									<option value="pimpinan">
										Pimpinan (Monitoring & Review Kalender)
									</option>
									<option value="admin">
										Administrator (Hak Penuh & Kelola Pengguna)
									</option>
								</select>
							</div>

							<div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4e4e7] mt-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									disabled={actionLoading}
									className="px-4 py-2 text-xs font-semibold text-[#71717a] hover:text-[#09090b] rounded-lg transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={actionLoading}
									className="px-4 py-2 bg-[#09090b] text-white text-xs font-semibold rounded-lg hover:bg-[#27272a] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
								>
									{actionLoading ? "Menyimpan..." : "Daftarkan Pengguna"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL: Toggle Status Confirmation */}
			{actionType === "toggleStatus" && selectedUser && (
				<div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
					<div className="w-full max-w-[420px] bg-white border border-[#e4e4e7] rounded-2xl shadow-xl p-6 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<h3 className="text-base font-bold text-[#09090b]">
								{selectedUser.status === "active"
									? "Nonaktifkan Akses Pengguna"
									: "Aktifkan Kembali Pengguna"}
							</h3>
							<p className="text-xs text-[#71717a] leading-relaxed">
								{selectedUser.status === "active"
									? `Apakah Anda yakin ingin menonaktifkan akun "${selectedUser.name}" (${selectedUser.email})? Pengguna ini tidak akan bisa login ke dashboard hingga diaktifkan kembali.`
									: `Aktifkan kembali akun "${selectedUser.name}" (${selectedUser.email}) agar dapat login ke dashboard?`}
							</p>
						</div>
						<div className="flex gap-2 justify-end pt-2">
							<button
								type="button"
								onClick={() => {
									setSelectedUser(null);
									setActionType(null);
								}}
								disabled={actionLoading}
								className="px-4 py-2 text-xs font-medium border border-[#e4e4e7] rounded-lg bg-white hover:bg-zinc-50 cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleToggleStatus}
								disabled={actionLoading}
								className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer ${
									selectedUser.status === "active"
										? "bg-amber-600 hover:bg-amber-700"
										: "bg-emerald-600 hover:bg-emerald-700"
								}`}
							>
								{actionLoading
									? "Memproses..."
									: selectedUser.status === "active"
										? "Ya, Nonaktifkan"
										: "Ya, Aktifkan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL: Delete User Confirmation */}
			{actionType === "delete" && selectedUser && (
				<div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
					<div className="w-full max-w-[420px] bg-white border border-[#e4e4e7] rounded-2xl shadow-xl p-6 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<h3 className="text-base font-bold text-rose-600">
								Hapus Akun Pengguna
							</h3>
							<p className="text-xs text-[#71717a] leading-relaxed">
								Apakah Anda yakin ingin menghapus akun{" "}
								<strong>"{selectedUser.name}"</strong> ({selectedUser.email})
								secara permanen? Seluruh sesi login terkait akan langsung
								dihentikan.
							</p>
						</div>
						<div className="flex gap-2 justify-end pt-2">
							<button
								type="button"
								onClick={() => {
									setSelectedUser(null);
									setActionType(null);
								}}
								disabled={actionLoading}
								className="px-4 py-2 text-xs font-medium border border-[#e4e4e7] rounded-lg bg-white hover:bg-zinc-50 cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleDeleteUser}
								disabled={actionLoading}
								className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-all cursor-pointer"
							>
								{actionLoading ? "Menghapus..." : "Ya, Hapus Akun"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
