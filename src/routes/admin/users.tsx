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
	admin:
		"bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
	operator:
		"bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
	pimpinan:
		"bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
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
			<div className="flex h-64 items-center justify-center bg-background">
				<div className="text-sm font-medium text-muted-foreground animate-pulse">
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
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Manajemen Pengguna & Akun Google
					</h2>
					<p className="text-xs text-muted-foreground">
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
						className="self-start px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<UserPlus size={16} />
						<span>Daftarkan Akun Google</span>
					</button>
				)}
			</div>

			{/* Alert Messages */}
			{successMessage && (
				<div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
					<CheckCircle2
						size={16}
						className="text-emerald-600 dark:text-emerald-400 shrink-0"
					/>
					<span>{successMessage}</span>
				</div>
			)}

			{error && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-3">
					<AlertCircle size={18} className="shrink-0" />
					<span>{error}</span>
					<button
						onClick={fetchUsers}
						className="ml-auto underline font-medium cursor-pointer"
					>
						Coba Lagi
					</button>
				</div>
			)}

			{/* Users Table */}
			<div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
								<th className="p-4">Nama Lengkap</th>
								<th className="p-4">Email Google (SSO)</th>
								<th className="p-4">Peran (Role)</th>
								<th className="p-4">Status Akses</th>
								<th className="p-4 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border text-sm">
							{paginatedUsers.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="p-8 text-center text-muted-foreground text-xs"
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
											className="hover:bg-muted/30 transition-colors"
										>
											<td className="p-4 font-semibold text-foreground">
												<div className="flex items-center gap-2">
													<span>{u.name}</span>
													{isSelf && (
														<span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold rounded border border-border">
															Anda
														</span>
													)}
												</div>
											</td>
											<td className="p-4 text-muted-foreground font-mono text-xs">
												<div className="flex items-center gap-1.5">
													<Mail
														size={13}
														className="text-muted-foreground/70"
													/>
													<span>{u.email}</span>
												</div>
											</td>
											<td className="p-4">
												<span
													className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md border ${ROLE_COLORS[u.role] || "bg-muted text-muted-foreground border-border"}`}
												>
													{ROLE_LABELS[u.role] || u.role}
												</span>
											</td>
											<td className="p-4">
												<span
													className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md border ${
														u.status === "active"
															? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
															: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
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
																	? "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
																	: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
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
															className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
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
				<div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/40">
					<span>
						Menampilkan {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} dari
						total {totalItems} akun
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

			{/* MODAL: Daftarkan Akun Google Baru */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
					<div className="w-full max-w-[460px] bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col gap-5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
									<UserPlus size={20} />
								</div>
								<div>
									<h3 className="text-base font-bold text-foreground">
										Daftarkan Akun Google
									</h3>
									<p className="text-xs text-muted-foreground">
										Beri hak akses login Google ke sistem Sarpras
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="p-1 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
							>
								<X size={18} />
							</button>
						</div>

						{formError && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
								<AlertCircle size={15} className="shrink-0" />
								<span>{formError}</span>
							</div>
						)}

						<form onSubmit={handleCreateUser} className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-foreground">
									Nama Lengkap Petugas{" "}
									<span className="text-destructive">*</span>
								</label>
								<input
									type="text"
									required
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="Misal: Ahmad Fauzi"
									className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:outline-none"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-foreground">
									Alamat Email Google / Gmail{" "}
									<span className="text-destructive">*</span>
								</label>
								<input
									type="email"
									required
									value={newEmail}
									onChange={(e) => setNewEmail(e.target.value)}
									placeholder="nama@gmail.com / nama@setneg.go.id"
									className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:outline-none"
								/>
								<span className="text-[11px] text-muted-foreground">
									Petugas akan login menggunakan tombol "Masuk dengan Google"
									dengan email ini.
								</span>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-foreground">
									Hak Akses / Peran (Role){" "}
									<span className="text-destructive">*</span>
								</label>
								<select
									value={newRole}
									onChange={(e) => setNewRole(e.target.value as any)}
									className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
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

							<div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									disabled={actionLoading}
									className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={actionLoading}
									className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
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
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
					<div className="w-full max-w-[420px] bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<h3 className="text-base font-bold text-foreground">
								{selectedUser.status === "active"
									? "Nonaktifkan Akses Pengguna"
									: "Aktifkan Kembali Pengguna"}
							</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
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
								className="px-4 py-2 text-xs font-medium border border-border rounded-lg bg-card text-foreground hover:bg-muted cursor-pointer"
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
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
					<div className="w-full max-w-[420px] bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<h3 className="text-base font-bold text-destructive">
								Hapus Akun Pengguna
							</h3>
							<p className="text-xs text-muted-foreground leading-relaxed">
								Apakah Anda yakin ingin menghapus akun{" "}
								<strong className="text-foreground">
									"{selectedUser.name}"
								</strong>{" "}
								({selectedUser.email}) secara permanen? Seluruh sesi login
								terkait akan langsung dihentikan.
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
								className="px-4 py-2 text-xs font-medium border border-border rounded-lg bg-card text-foreground hover:bg-muted cursor-pointer"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={handleDeleteUser}
								disabled={actionLoading}
								className="px-4 py-2 bg-destructive text-destructive-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
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
