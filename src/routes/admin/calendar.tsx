import { createFileRoute } from "@tanstack/react-router";
import { endOfMonth, startOfMonth } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminCalendarView } from "#/components/admin/admin-calendar-view";
import type { CalendarEventItem } from "#/components/admin/calendar-event-popover";
import { getAdminCalendarEventsFn } from "#/lib/booking/admin-fns.functions";
import { getPublicAssetsListFn } from "#/lib/booking/public-fns.functions";

export const Route = createFileRoute("/admin/calendar")({
	component: AdminCalendarRouteComponent,
});

function AdminCalendarRouteComponent() {
	const [currentDate, setCurrentDate] = useState<Date>(new Date());
	const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
	const [selectedAssetType, setSelectedAssetType] = useState<
		"all" | "room" | "dormitory" | "vehicle" | "field" | "equipment"
	>("all");

	const [assetsList, setAssetsList] = useState<Array<any>>([]);
	const [events, setEvents] = useState<CalendarEventItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Load assets list once
	useEffect(() => {
		getPublicAssetsListFn()
			.then(setAssetsList)
			.catch((err) =>
				console.error("Failed to load assets list for calendar", err),
			);
	}, []);

	// Fetch events whenever month / filters change
	const fetchEvents = () => {
		setLoading(true);
		setError(null);

		// Calculate broad range around current month (e.g. 1 month before to 1 month after)
		const start = startOfMonth(currentDate);
		start.setDate(start.getDate() - 14); // Buffer for previous month overflow
		const end = endOfMonth(currentDate);
		end.setDate(end.getDate() + 14); // Buffer for next month overflow

		getAdminCalendarEventsFn({
			data: {
				assetId: selectedAssetId,
				assetType: selectedAssetType,
				start: start.toISOString(),
				end: end.toISOString(),
			},
		})
			.then((data: any) => {
				setEvents(data);
			})
			.catch((err: any) => {
				setError(err.message || "Gagal memuat jadwal operasional");
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchEvents();
	}, [currentDate, selectedAssetId, selectedAssetType]);

	return (
		<div className="flex flex-col gap-6 max-w-7xl">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h2 className="text-2xl font-bold tracking-tight text-foreground">
						Kalender Operasional Sarpras
					</h2>
					<p className="text-xs text-muted-foreground">
						Pantau jadwal penggunaan ruangan, hunian asrama, dan penutupan
						pemeliharaan
					</p>
				</div>

				<button
					type="button"
					onClick={fetchEvents}
					className="self-start md:self-auto px-3.5 py-2 bg-card border border-border text-xs font-semibold text-foreground rounded-lg hover:bg-muted transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
				>
					<RefreshCw size={14} className={loading ? "animate-spin text-muted-foreground" : "text-muted-foreground"} />
					<span>Segarkan Jadwal</span>
				</button>
			</div>

			{error && (
				<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-center gap-2">
					<AlertCircle size={16} className="shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Calendar Component */}
			<AdminCalendarView
				events={events}
				assetsList={assetsList}
				currentDate={currentDate}
				onDateChange={setCurrentDate}
				selectedAssetId={selectedAssetId}
				onAssetChange={setSelectedAssetId}
				selectedAssetType={selectedAssetType}
				onAssetTypeChange={setSelectedAssetType}
				loading={loading}
			/>
		</div>
	);
}
