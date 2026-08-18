import {
	addDays,
	addMonths,
	addWeeks,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	isToday,
	parseISO,
	startOfMonth,
	startOfWeek,
	subMonths,
	subWeeks,
} from "date-fns";
import {
	Building2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
	type CalendarEventItem,
	CalendarEventPopover,
} from "./calendar-event-popover";

interface AssetOption {
	id: string;
	name: string;
	type: string;
	capacity: number;
}

export type CalendarAssetTypeFilter =
	| "all"
	| "room"
	| "dormitory"
	| "vehicle"
	| "field"
	| "equipment";

interface AdminCalendarViewProps {
	events: CalendarEventItem[];
	assetsList: AssetOption[];
	currentDate: Date;
	onDateChange: (date: Date) => void;
	selectedAssetId?: string;
	onAssetChange: (assetId?: string) => void;
	selectedAssetType?: CalendarAssetTypeFilter;
	onAssetTypeChange: (assetType: CalendarAssetTypeFilter) => void;
	loading?: boolean;
}

export function AdminCalendarView({
	events,
	assetsList,
	currentDate,
	onDateChange,
	selectedAssetId,
	onAssetChange,
	selectedAssetType = "all",
	onAssetTypeChange,
	loading = false,
}: AdminCalendarViewProps) {
	const [viewMode, setViewMode] = useState<"month" | "week">("month");
	const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(
		null,
	);

	// Navigation handlers
	const handlePrev = () => {
		if (viewMode === "month") {
			onDateChange(subMonths(currentDate, 1));
		} else {
			onDateChange(subWeeks(currentDate, 1));
		}
	};

	const handleNext = () => {
		if (viewMode === "month") {
			onDateChange(addMonths(currentDate, 1));
		} else {
			onDateChange(addWeeks(currentDate, 1));
		}
	};

	const handleToday = () => {
		onDateChange(new Date());
	};

	// Month Grid Math
	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(monthStart);
	const calendarStartDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
	const calendarEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const monthDays: Date[] = [];
	let dayCursor = calendarStartDate;
	while (dayCursor <= calendarEndDate) {
		monthDays.push(dayCursor);
		dayCursor = addDays(dayCursor, 1);
	}

	// Week Grid Math
	const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
	const weekDays: Date[] = [];
	for (let i = 0; i < 7; i++) {
		weekDays.push(addDays(weekStartDate, i));
	}

	const hoursRange = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00

	// Helper to find events for a day
	const getEventsForDay = (date: Date) => {
		return events.filter((e) => {
			const start = parseISO(e.startDate);
			const end = parseISO(e.endDate);
			// Check if date falls within [start, end]
			const checkStart = new Date(date);
			checkStart.setHours(0, 0, 0, 0);
			const checkEnd = new Date(date);
			checkEnd.setHours(23, 59, 59, 999);
			return start <= checkEnd && end >= checkStart;
		});
	};

	return (
		<div className="bg-card text-foreground border border-border rounded-xl shadow-xs flex flex-col gap-4 p-4 md:p-6">
			{/* Top Controls Bar */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
				{/* Asset & Type Selectors */}
				<div className="flex items-center gap-3 flex-wrap">
					<div className="flex items-center gap-1.5">
						<Building2 size={16} className="text-muted-foreground" />
						<select
							value={selectedAssetId || "all"}
							onChange={(e) =>
								onAssetChange(
									e.target.value === "all" ? undefined : e.target.value,
								)
							}
							aria-label="Filter Fasilitas"
							className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
						>
							<option value="all">Semua Fasilitas</option>
							{assetsList.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name} ({a.type === "room" ? "Ruangan" : "Asrama"})
								</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-1 bg-muted/40 p-0.5 border border-border rounded-lg flex-wrap">
						<button
							type="button"
							onClick={() => onAssetTypeChange("all")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "all"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Semua
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("room")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "room"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Ruangan
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("dormitory")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "dormitory"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Asrama
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("vehicle")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "vehicle"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Kendaraan
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("field")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "field"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Lapangan
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("equipment")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "equipment"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Peralatan
						</button>
					</div>
				</div>

				{/* View Toggle & Navigation */}
				<div className="flex items-center gap-3 flex-wrap">
					{/* Month / Week Switch */}
					<div className="flex items-center gap-1 bg-muted/40 p-0.5 border border-border rounded-lg">
						<button
							type="button"
							onClick={() => setViewMode("month")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								viewMode === "month"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Bulan
						</button>
						<button
							type="button"
							onClick={() => setViewMode("week")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								viewMode === "week"
									? "bg-card shadow-xs text-foreground font-semibold"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Minggu
						</button>
					</div>

					{/* Navigation controls */}
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={handlePrev}
							className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
							aria-label="Periode Sebelumnya"
						>
							<ChevronLeft size={16} />
						</button>

						<button
							type="button"
							onClick={handleToday}
							className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
						>
							Hari Ini
						</button>

						<button
							type="button"
							onClick={handleNext}
							className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
							aria-label="Periode Selanjutnya"
						>
							<ChevronRight size={16} />
						</button>

						<span className="font-bold text-sm text-foreground ml-2 min-w-[140px]">
							{viewMode === "month"
								? format(currentDate, "MMMM yyyy")
								: `${format(weekDays[0], "dd MMM")} - ${format(weekDays[6], "dd MMM yyyy")}`}
						</span>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap pb-1">
				<div className="flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
					<span>Disetujui (Approved)</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
					<span>Menunggu Persetujuan (Pending)</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
					<span>Penutupan / Pemeliharaan (Closed)</span>
				</div>
			</div>

			{/* Loading overlay */}
			{loading && (
				<div className="text-center py-6 text-xs text-muted-foreground animate-pulse">
					Memperbarui jadwal operasional...
				</div>
			)}

			{/* Month View Grid */}
			{viewMode === "month" && (
				<div className="border border-border rounded-lg overflow-hidden flex flex-col">
					{/* Weekday Headers */}
					<div className="grid grid-cols-7 bg-muted/40 border-b border-border text-center text-[11px] font-semibold text-muted-foreground py-2">
						<div>Senin</div>
						<div>Selasa</div>
						<div>Rabu</div>
						<div>Kamis</div>
						<div>Jumat</div>
						<div className="text-rose-500">Sabtu</div>
						<div className="text-rose-500">Minggu</div>
					</div>

					{/* Day Cells Matrix */}
					<div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border bg-card">
						{monthDays.map((day) => {
							const dayEvents = getEventsForDay(day);
							const isCurrentMonth = isSameMonth(day, currentDate);
							const today = isToday(day);

							return (
								<div
									key={day.toISOString()}
									className={`min-h-[110px] p-1.5 flex flex-col gap-1 transition-colors ${
										!isCurrentMonth ? "bg-muted/30 text-muted-foreground/50" : ""
									} ${today ? "bg-primary/5" : ""}`}
								>
									<div className="flex items-center justify-between">
										<span
											className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
												today
													? "bg-primary text-primary-foreground font-bold"
													: !isCurrentMonth
														? "text-muted-foreground/50"
														: "text-foreground"
											}`}
										>
											{format(day, "d")}
										</span>
										{dayEvents.length > 0 && (
											<span className="text-[10px] font-medium text-muted-foreground">
												{dayEvents.length} agenda
											</span>
										)}
									</div>

									{/* Event Badges List */}
									<div className="flex flex-col gap-1 overflow-hidden">
										{dayEvents.slice(0, 3).map((event) => (
											<button
												key={event.id}
												type="button"
												onClick={() => setSelectedEvent(event)}
												className={`text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-80 cursor-pointer border ${
													event.status === "approved"
														? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
														: event.status === "closed"
															? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
															: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
												}`}
												title={`${event.title} (${event.assetName})`}
											>
												{event.requesterName} - {event.assetName}
											</button>
										))}
										{dayEvents.length > 3 && (
											<span className="text-[9px] text-muted-foreground font-semibold pl-1">
												+{dayEvents.length - 3} lainnya
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Week View Grid */}
			{viewMode === "week" && (
				<div className="border border-border rounded-lg overflow-x-auto">
					<div className="min-w-[700px] flex flex-col">
						{/* Week Header */}
						<div className="grid grid-cols-8 bg-muted/40 border-b border-border text-center text-xs font-semibold py-2">
							<div className="text-[11px] text-muted-foreground">Jam (WIB)</div>
							{weekDays.map((day) => (
								<div
									key={day.toISOString()}
									className={`flex flex-col gap-0.5 ${
										isToday(day) ? "text-primary font-bold" : "text-foreground"
									}`}
								>
									<span className="text-[10px] text-muted-foreground uppercase">
										{format(day, "EEE")}
									</span>
									<span className="text-xs">{format(day, "dd MMM")}</span>
								</div>
							))}
						</div>

						{/* Hours Rows */}
						<div className="divide-y divide-border bg-card">
							{hoursRange.map((hour) => (
								<div
									key={hour}
									className="grid grid-cols-8 min-h-[50px] divide-x divide-border"
								>
									<div className="text-[11px] font-mono text-muted-foreground p-2 bg-muted/20 text-center">
										{String(hour).padStart(2, "0")}:00
									</div>
									{weekDays.map((day) => {
										const dayEvents = getEventsForDay(day);
										// Check if event overlaps this hour
										const hourEvents = dayEvents.filter((e) => {
											const start = parseISO(e.startDate);
											const end = parseISO(e.endDate);
											const startHour = start.getHours();
											const endHour =
												end.getMinutes() > 0
													? end.getHours() + 1
													: end.getHours();
											return hour >= startHour && hour < endHour;
										});

										return (
											<div
												key={day.toISOString()}
												className="p-1 flex flex-col gap-1 overflow-hidden"
											>
												{hourEvents.map((event) => (
													<button
														key={event.id}
														type="button"
														onClick={() => setSelectedEvent(event)}
														className={`text-left text-[10px] p-1 rounded font-medium truncate transition-opacity hover:opacity-85 cursor-pointer border ${
															event.status === "approved"
																? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
																: event.status === "closed"
																	? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
																	: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
														}`}
													>
														<div className="font-semibold truncate">
															{event.requesterName}
														</div>
														<div className="text-[9px] opacity-80 truncate">
															{event.assetName}
														</div>
													</button>
												))}
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Event Detail Popover */}
			<CalendarEventPopover
				event={selectedEvent}
				onClose={() => setSelectedEvent(null)}
			/>
		</div>
	);
}
