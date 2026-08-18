import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Eye,
	Inbox,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BookingReviewDrawer } from "#/components/admin/booking-review-drawer";
import {
	BookingsFilterBar,
	type BookingsFilterState,
} from "#/components/admin/bookings-filter-bar";
import { RejectionReasonModal } from "#/components/admin/rejection-reason-modal";
import {
	approveBookingAdminFn,
	getAdminBookingsFn,
	rejectBookingAdminFn,
} from "#/lib/booking/admin-fns.functions";
import { ASSET_TYPE_LABELS, type AssetType } from "#/lib/booking/types";
import { formatJakartaDisplay } from "#/lib/timezone/datetime";

const BookingsSearchSchema = z.object({
	status: z
		.enum(["all", "pending", "approved", "rejected", "cancelled"])
		.optional(),
	assetType: z
		.enum(["all", "room", "dormitory", "vehicle", "field", "equipment"])
		.optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	search: z.string().optional(),
	page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/admin/bookings")({
	validateSearch: (search) => BookingsSearchSchema.parse(search),
	component: AdminBookingsComponent,
});

function AdminBookingsComponent() {
	const { user: currentUser } = Route.useRouteContext();
	const searchParams = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const [data, setData] = useState<{
		items: Array<any>;
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
		null,
	);
	const [rejectModalState, setRejectModalState] = useState<{
		isOpen: boolean;
		bookingId: string;
		requesterName: string;
		assetName: string;
	}>({
		isOpen: false,
		bookingId: "",
		requesterName: "",
		assetName: "",
	});
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const fetchBookings = () => {
		setLoading(true);
		getAdminBookingsFn({
			data: {
				status: searchParams.status,
				assetType: searchParams.assetType,
				startDate: searchParams.startDate,
				endDate: searchParams.endDate,
				search: searchParams.search,
				page: searchParams.page,
				limit: 10,
			},
		})
			.then(setData)
			.catch((err) => {
				setNotification({
					type: "error",
					message: err.message || "Gagal memuat data permohonan",
				});
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchBookings();
	}, [
		searchParams.status,
		searchParams.assetType,
		searchParams.startDate,
		searchParams.endDate,
		searchParams.search,
		searchParams.page,
	]);

	const handleFilterChange = (updated: Partial<BookingsFilterState>) => {
		navigate({
			search: (prev) => ({
				...prev,
				...updated,
				page: 1, // Reset to page 1 on filter update
			}),
		});
	};

	const handleFilterReset = () => {
		navigate({
			search: {
				status: "all",
				assetType: "all",
				page: 1,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: (prev) => ({
				...prev,
				page: newPage,
			}),
		});
	};

	const handleApprove = async (bookingId: string) => {
		try {
			await approveBookingAdminFn({ data: { bookingId } });
			setNotification({
				type: "success",
				message: "Permohonan berhasil disetujui.",
			});
			fetchBookings();
		} catch (err: any) {
			setNotification({
				type: "error",
				message: err.message || "Gagal menyetujui permohonan.",
			});
			throw err;
		}
	};

	const handleReject = async (rejectionReason: string) => {
		try {
			await rejectBookingAdminFn({
				data: {
					bookingId: rejectModalState.bookingId,
					rejectionReason,
				},
			});
			setNotification({
				type: "success",
				message: "Permohonan telah ditolak dengan catatan alasan.",
			});
			fetchBookings();
		} catch (err: any) {
			setNotification({
				type: "error",
				message: err.message || "Gagal menolak permohonan.",
			});
			throw err;
		}
	};

	return (
		<div className="flex flex-col gap-6 max-w-7xl">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Kelola Permohonan Booking
					</h2>
					<p className="text-xs text-muted-foreground">
						Daftar permohonan peminjaman ruangan dan asrama PPKASN
					</p>
				</div>
			</div>

			{/* Notifications */}
			{notification && (
				<div
					className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
						notification.type === "success"
							? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
							: "bg-destructive/10 border-destructive/20 text-destructive"
					}`}
				>
					<div className="flex items-center gap-2">
						{notification.type === "success" ? (
							<CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
						) : (
							<AlertCircle size={16} />
						)}
						<span>{notification.message}</span>
					</div>
					<button
						type="button"
						onClick={() => setNotification(null)}
						className="text-xs font-semibold hover:underline cursor-pointer"
					>
						Tutup
					</button>
				</div>
			)}

			{/* Filter Toolbar */}
			<BookingsFilterBar
				filters={{
					status: searchParams.status || "all",
					assetType: searchParams.assetType || "all",
					startDate: searchParams.startDate,
					endDate: searchParams.endDate,
					search: searchParams.search,
				}}
				onChange={handleFilterChange}
				onReset={handleFilterReset}
			/>

			{/* Bookings Table */}
			<div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold text-[11px]">
							<tr>
								<th className="py-3 px-4">Ref / Kode</th>
								<th className="py-3 px-4">Fasilitas</th>
								<th className="py-3 px-4">Pemohon & Instansi</th>
								<th className="py-3 px-4">Jadwal Penggunaan (WIB)</th>
								<th className="py-3 px-4">Peserta</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{loading && (
								<tr>
									<td
										colSpan={7}
										className="py-12 text-center text-muted-foreground font-medium"
									>
										Memuat data permohonan...
									</td>
								</tr>
							)}

							{!loading && data?.items.length === 0 && (
								<tr>
									<td colSpan={7} className="py-16 text-center text-muted-foreground">
										<div className="flex flex-col items-center justify-center gap-2">
											<Inbox size={32} className="text-muted-foreground/60" />
											<span className="font-medium text-sm text-foreground">
												Tidak Ada Data Ditemukan
											</span>
											<span className="text-xs">
												Coba ubah kata kunci pencarian atau sesuaikan filter
												status.
											</span>
										</div>
									</td>
								</tr>
							)}

							{!loading &&
								data?.items.map((item) => (
									<tr
										key={item.id}
										className="hover:bg-muted/30 transition-colors"
									>
										<td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
											<div className="flex flex-col gap-0.5">
												<span>{item.id.slice(0, 8)}...</span>
												{item.groupId && (
													<span
														className="inline-flex items-center gap-0.5 text-[9px] font-sans font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-max border border-primary/20"
														title={`Group Ref: ${item.groupId}`}
													>
														GRUP ACARA
													</span>
												)}
											</div>
										</td>
										<td className="py-3 px-4 font-medium text-foreground">
											<div className="flex flex-col">
												<span>{item.assetName}</span>
												<span className="text-[10px] text-muted-foreground">
													{ASSET_TYPE_LABELS[item.assetType as AssetType] ||
														item.assetType}
												</span>
											</div>
										</td>
										<td className="py-3 px-4">
											<div className="flex flex-col">
												<span className="font-semibold text-foreground">
													{item.requesterName}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{item.requesterOrganization || item.requesterEmail}
												</span>
											</div>
										</td>
										<td className="py-3 px-4 text-foreground">
											<div className="flex flex-col text-[11px]">
												<span>
													{formatJakartaDisplay(
														item.startDate,
														"dd MMM yyyy, HH:mm",
													)}
												</span>
												<span className="text-muted-foreground">
													s/d{" "}
													{formatJakartaDisplay(item.endDate, "dd MMM, HH:mm")}{" "}
													WIB
												</span>
											</div>
										</td>
										<td className="py-3 px-4 text-foreground">
											{item.attendance ? (
												<span className="flex items-center gap-1">
													<Users size={13} className="text-muted-foreground" />
													{item.attendance} orang
												</span>
											) : (
												<span className="text-muted-foreground/60">-</span>
											)}
										</td>
										<td className="py-3 px-4">
											<span
												className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
													item.status === "approved"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
														: item.status === "rejected"
															? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
															: item.status === "cancelled"
																? "bg-muted text-muted-foreground border-border"
																: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
												}`}
											>
												{item.status === "approved"
													? "Disetujui"
													: item.status === "rejected"
														? "Ditolak"
														: item.status === "cancelled"
															? "Dibatalkan"
															: "Menunggu"}
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<button
													type="button"
													onClick={() => setSelectedBookingId(item.id)}
													className="px-2.5 py-1.5 bg-card hover:bg-muted text-foreground text-xs font-medium rounded border border-border transition-colors flex items-center gap-1 cursor-pointer"
												>
													<Eye size={13} />
													<span>Tinjau</span>
												</button>

												{(currentUser as any)?.role !== "pimpinan" &&
													item.status === "pending" && (
														<>
															<button
																type="button"
																onClick={() => handleApprove(item.id)}
																className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer shadow-xs"
																title="Setujui permohonan langsung"
															>
																Setujui
															</button>
															<button
																type="button"
																onClick={() =>
																	setRejectModalState({
																		isOpen: true,
																		bookingId: item.id,
																		requesterName: item.requesterName,
																		assetName: item.assetName,
																	})
																}
																className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-semibold rounded transition-colors cursor-pointer"
																title="Tolak permohonan"
															>
																Tolak
															</button>
														</>
													)}
											</div>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>

				{/* Pagination Controls */}
				{data && data.totalPages > 1 && (
					<div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/40">
						<span>
							Menampilkan {(data.page - 1) * data.limit + 1} -{" "}
							{Math.min(data.page * data.limit, data.total)} dari {data.total}{" "}
							permohonan
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => handlePageChange(data.page - 1)}
								disabled={data.page <= 1}
								className="px-2.5 py-1.5 border border-border rounded bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted flex items-center gap-1 cursor-pointer"
							>
								<ChevronLeft size={14} />
								<span>Sebelumnya</span>
							</button>
							<span className="font-semibold text-foreground">
								Halaman {data.page} / {data.totalPages}
							</span>
							<button
								type="button"
								onClick={() => handlePageChange(data.page + 1)}
								disabled={data.page >= data.totalPages}
								className="px-2.5 py-1.5 border border-border rounded bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted flex items-center gap-1 cursor-pointer"
							>
								<span>Selanjutnya</span>
								<ChevronRight size={14} />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Review Drawer */}
			<BookingReviewDrawer
				bookingId={selectedBookingId}
				onClose={() => setSelectedBookingId(null)}
				onApprove={handleApprove}
				onOpenRejectModal={(booking) => {
					setRejectModalState({
						isOpen: true,
						bookingId: booking.id,
						requesterName: booking.requesterName,
						assetName: booking.assetName,
					});
				}}
				isReadOnly={(currentUser as any)?.role === "pimpinan"}
			/>

			{/* Rejection Modal */}
			<RejectionReasonModal
				isOpen={rejectModalState.isOpen}
				bookingId={rejectModalState.bookingId}
				requesterName={rejectModalState.requesterName}
				assetName={rejectModalState.assetName}
				onClose={() =>
					setRejectModalState((prev) => ({ ...prev, isOpen: false }))
				}
				onSubmit={handleReject}
			/>
		</div>
	);
}
