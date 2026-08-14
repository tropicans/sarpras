import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	CalendarCheck2,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Eye,
	Inbox,
	Users,
	XCircle,
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
} from "#/lib/booking/admin-fns.server";
import { formatJakartaDisplay } from "#/lib/timezone/datetime";

const BookingsSearchSchema = z.object({
	status: z
		.enum(["all", "pending", "approved", "rejected", "cancelled"])
		.optional()
		.default("all"),
	assetType: z.enum(["all", "room", "dormitory"]).optional().default("all"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	search: z.string().optional(),
	page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/bookings")({
	validateSearch: (search) => BookingsSearchSchema.parse(search),
	component: AdminBookingsComponent,
});

function AdminBookingsComponent() {
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
					<h2 className="text-2xl font-bold tracking-tight text-[#09090b]">
						Kelola Permohonan Booking
					</h2>
					<p className="text-xs text-[#71717a]">
						Daftar permohonan peminjaman ruangan dan asrama PPKASN
					</p>
				</div>
			</div>

			{/* Notifications */}
			{notification && (
				<div
					className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
						notification.type === "success"
							? "bg-emerald-50 border-emerald-200 text-emerald-800"
							: "bg-rose-50 border-rose-200 text-rose-800"
					}`}
				>
					<div className="flex items-center gap-2">
						{notification.type === "success" ? (
							<CheckCircle size={16} />
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
			<div className="bg-white border border-[#e4e4e7] rounded-xl shadow-xs overflow-hidden flex flex-col">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead className="bg-[#fafafa] border-b border-[#e4e4e7] text-[#71717a] uppercase font-semibold text-[11px]">
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
						<tbody className="divide-y divide-[#e4e4e7]">
							{loading && (
								<tr>
									<td
										colSpan={7}
										className="py-12 text-center text-[#71717a] font-medium"
									>
										Memuat data permohonan...
									</td>
								</tr>
							)}

							{!loading && data?.items.length === 0 && (
								<tr>
									<td colSpan={7} className="py-16 text-center text-[#71717a]">
										<div className="flex flex-col items-center justify-center gap-2">
											<Inbox size={32} className="text-[#a1a1aa]" />
											<span className="font-medium text-sm text-[#09090b]">
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
										className="hover:bg-[#fafafa] transition-colors"
									>
										<td className="py-3 px-4 font-mono text-[11px] text-[#71717a]">
											{item.id.slice(0, 8)}...
										</td>
										<td className="py-3 px-4 font-medium text-[#09090b]">
											<div className="flex flex-col">
												<span>{item.assetName}</span>
												<span className="text-[10px] text-[#71717a] capitalize">
													{item.assetType === "room" ? "Ruangan" : "Asrama"}
												</span>
											</div>
										</td>
										<td className="py-3 px-4">
											<div className="flex flex-col">
												<span className="font-semibold text-[#09090b]">
													{item.requesterName}
												</span>
												<span className="text-[11px] text-[#71717a]">
													{item.requesterOrganization || item.requesterEmail}
												</span>
											</div>
										</td>
										<td className="py-3 px-4 text-[#09090b]">
											<div className="flex flex-col text-[11px]">
												<span>
													{formatJakartaDisplay(
														item.startDate,
														"dd MMM yyyy, HH:mm",
													)}
												</span>
												<span className="text-[#71717a]">
													s/d{" "}
													{formatJakartaDisplay(item.endDate, "dd MMM, HH:mm")}{" "}
													WIB
												</span>
											</div>
										</td>
										<td className="py-3 px-4 text-[#09090b]">
											{item.attendance ? (
												<span className="flex items-center gap-1">
													<Users size={13} className="text-[#71717a]" />
													{item.attendance} orang
												</span>
											) : (
												<span className="text-[#a1a1aa]">-</span>
											)}
										</td>
										<td className="py-3 px-4">
											<span
												className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
													item.status === "approved"
														? "bg-emerald-100 text-emerald-800"
														: item.status === "rejected"
															? "bg-rose-100 text-rose-800"
															: item.status === "cancelled"
																? "bg-zinc-100 text-zinc-800"
																: "bg-amber-100 text-amber-800"
												}`}
											>
												{item.status}
											</span>
										</td>
										<td className="py-3 px-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<button
													type="button"
													onClick={() => setSelectedBookingId(item.id)}
													className="px-2.5 py-1.5 bg-[#fafafa] hover:bg-[#e4e4e7] text-[#09090b] text-xs font-medium rounded border border-[#e4e4e7] transition-colors flex items-center gap-1 cursor-pointer"
												>
													<Eye size={13} />
													<span>Tinjau</span>
												</button>

												{item.status === "pending" && (
													<>
														<button
															type="button"
															onClick={() => handleApprove(item.id)}
															className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
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
															className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded transition-colors cursor-pointer"
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
					<div className="p-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#71717a] bg-[#fafafa]">
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
								className="px-2.5 py-1.5 border border-[#e4e4e7] rounded bg-white text-[#09090b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f4f5] flex items-center gap-1 cursor-pointer"
							>
								<ChevronLeft size={14} />
								<span>Sebelumnya</span>
							</button>
							<span className="font-semibold text-[#09090b]">
								Halaman {data.page} / {data.totalPages}
							</span>
							<button
								type="button"
								onClick={() => handlePageChange(data.page + 1)}
								disabled={data.page >= data.totalPages}
								className="px-2.5 py-1.5 border border-[#e4e4e7] rounded bg-white text-[#09090b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f4f5] flex items-center gap-1 cursor-pointer"
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
