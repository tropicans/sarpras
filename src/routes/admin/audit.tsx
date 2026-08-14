import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AlertCircle, RefreshCw, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
	type AuditFilterState,
	AuditTable,
} from "#/components/admin/audit-table";
import { getAdminAuditLogsFn } from "#/lib/audit/admin-fns.functions";

const AuditSearchSchema = z.object({
	action: z.string().optional().default("all"),
	entityType: z
		.enum(["all", "booking", "asset", "user"])
		.optional()
		.default("all"),
	actorId: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/audit")({
	validateSearch: (search) => AuditSearchSchema.parse(search),
	beforeLoad: ({ context }) => {
		const user = (context as any).user;
		if (!user || user.role !== "admin") {
			throw redirect({ to: "/admin" });
		}
	},
	component: AdminAuditRouteComponent,
});

function AdminAuditRouteComponent() {
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
	const [error, setError] = useState<string | null>(null);

	const fetchAuditLogs = () => {
		setLoading(true);
		setError(null);

		getAdminAuditLogsFn({
			data: {
				action: searchParams.action,
				entityType: searchParams.entityType,
				actorId: searchParams.actorId,
				startDate: searchParams.startDate,
				endDate: searchParams.endDate,
				page: searchParams.page,
				limit: 20,
			},
		})
			.then(setData)
			.catch((err: any) => {
				setError(err.message || "Gagal memuat riwayat audit");
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchAuditLogs();
	}, [
		searchParams.action,
		searchParams.entityType,
		searchParams.actorId,
		searchParams.startDate,
		searchParams.endDate,
		searchParams.page,
	]);

	const handleFilterChange = (updated: Partial<AuditFilterState>) => {
		navigate({
			search: (prev) => ({
				...prev,
				...updated,
			}),
		});
	};

	const handleResetFilters = () => {
		navigate({
			search: {
				action: "all",
				entityType: "all",
				page: 1,
			},
		});
	};

	return (
		<div className="flex flex-col gap-6 max-w-7xl">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-[#09090b]">
						Riwayat Audit Sistem
					</h2>
					<p className="text-xs text-[#71717a]">
						Jejak rekaman aktivitas transaksional (append-only) seluruh operasi
						sarpras
					</p>
				</div>

				<button
					type="button"
					onClick={fetchAuditLogs}
					className="self-start md:self-auto px-3.5 py-2 bg-white border border-[#e4e4e7] text-xs font-semibold text-[#09090b] rounded-lg hover:bg-[#fafafa] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
				>
					<RefreshCw size={14} className={loading ? "animate-spin" : ""} />
					<span>Segarkan Log</span>
				</button>
			</div>

			{error && (
				<div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
					<AlertCircle size={16} className="shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Audit Table */}
			<AuditTable
				items={data?.items || []}
				total={data?.total || 0}
				page={data?.page || 1}
				totalPages={data?.totalPages || 1}
				limit={data?.limit || 20}
				filters={{
					action: searchParams.action || "all",
					entityType: searchParams.entityType || "all",
					actorId: searchParams.actorId,
					startDate: searchParams.startDate,
					endDate: searchParams.endDate,
					page: searchParams.page || 1,
				}}
				onFilterChange={handleFilterChange}
				onResetFilters={handleResetFilters}
				loading={loading}
			/>
		</div>
	);
}
