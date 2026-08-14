import {
	addDays,
	addMonths,
	addWeeks,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	isToday,
	parseISO,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
	subWeeks,
} from "date-fns";
import {
	AlertTriangle,
	Building2,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	Layers,
	Users,
} from "lucide-react";
import React, { useState } from "react";
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
		<div className="bg-white border border-[#e4e4e7] rounded-xl shadow-xs flex flex-col gap-4 p-4 md:p-6">
			{/* Top Controls Bar */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e4e4e7]">
				{/* Asset & Type Selectors */}
				<div className="flex items-center gap-3 flex-wrap">
					<div className="flex items-center gap-1.5">
						<Building2 size={16} className="text-[#71717a]" />
						<select
							value={selectedAssetId || "all"}
							onChange={(e) =>
								onAssetChange(
									e.target.value === "all" ? undefined : e.target.value,
								)
							}
							aria-label="Filter Fasilitas"
							className="px-3 py-1.5 bg-[#fafafa] border border-[#e4e4e7] rounded-lg text-xs font-semibold text-[#09090b] focus:outline-none focus:border-[#09090b] cursor-pointer"
						>
							<option value="all">Semua Fasilitas</option>
							{assetsList.map((a) => (
								<option key={a.id} value={a.id}>
									{a.name} ({a.type === "room" ? "Ruangan" : "Asrama"})
								</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-1 bg-[#fafafa] p-0.5 border border-[#e4e4e7] rounded-lg flex-wrap">
						<button
							type="button"
							onClick={() => onAssetTypeChange("all")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "all"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Semua
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("room")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "room"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Ruangan
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("dormitory")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "dormitory"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Asrama
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("vehicle")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "vehicle"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Kendaraan
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("field")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "field"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Lapangan
						</button>
						<button
							type="button"
							onClick={() => onAssetTypeChange("equipment")}
							className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								selectedAssetType === "equipment"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Peralatan
						</button>
					</div>
				</div>

				{/* View Toggle & Navigation */}
				<div className="flex items-center gap-3 flex-wrap">
					{/* Month / Week Switch */}
					<div className="flex items-center gap-1 bg-[#fafafa] p-0.5 border border-[#e4e4e7] rounded-lg">
						<button
							type="button"
							onClick={() => setViewMode("month")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								viewMode === "month"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
							}`}
						>
							Bulan
						</button>
						<button
							type="button"
							onClick={() => setViewMode("week")}
							className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								viewMode === "week"
									? "bg-white shadow-xs text-[#09090b] font-semibold"
									: "text-[#71717a] hover:text-[#09090b]"
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
							className="p-1.5 border border-[#e4e4e7] rounded-lg text-[#71717a] hover:text-[#09090b] hover:bg-[#fafafa] transition-colors cursor-pointer"
							aria-label="Periode Sebelumnya"
						>
							<ChevronLeft size={16} />
						</button>

						<button
							type="button"
							onClick={handleToday}
							className="px-2.5 py-1.5 border border-[#e4e4e7] rounded-lg text-xs font-medium text-[#09090b] hover:bg-[#fafafa] transition-colors cursor-pointer"
						>
							Hari Ini
						</button>

						<button
							type="button"
							onClick={handleNext}
							className="p-1.5 border border-[#e4e4e7] rounded-lg text-[#71717a] hover:text-[#09090b] hover:bg-[#fafafa] transition-colors cursor-pointer"
							aria-label="Periode Selanjutnya"
						>
							<ChevronRight size={16} />
						</button>

						<span className="font-bold text-sm text-[#09090b] ml-2 min-w-[140px]">
							{viewMode === "month"
								? format(currentDate, "MMMM yyyy")
								: `${format(weekDays[0], "dd MMM")} - ${format(weekDays[6], "dd MMM yyyy")}`}
						</span>
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-4 text-[11px] text-[#71717a] flex-wrap pb-1">
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
				<div className="text-center py-6 text-xs text-[#71717a] animate-pulse">
					Memperbarui jadwal operasional...
				</div>
			)}

			{/* Month View Grid */}
			{viewMode === "month" && (
				<div className="border border-[#e4e4e7] rounded-lg overflow-hidden flex flex-col">
					{/* Weekday Headers */}
					<div className="grid grid-cols-7 bg-[#fafafa] border-b border-[#e4e4e7] text-center text-[11px] font-semibold text-[#71717a] py-2">
						<div>Senin</div>
						<div>Selasa</div>
						<div>Rabu</div>
						<div>Kamis</div>
						<div>Jumat</div>
						<div className="text-rose-500">Sabtu</div>
						<div className="text-rose-500">Minggu</div>
					</div>

					{/* Day Cells Matrix */}
					<div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#e4e4e7] bg-white">
						{monthDays.map((day) => {
							const dayEvents = getEventsForDay(day);
							const isCurrentMonth = isSameMonth(day, currentDate);
							const today = isToday(day);

							return (
								<div
									key={day.toISOString()}
									className={`min-h-[110px] p-1.5 flex flex-col gap-1 transition-colors ${
										!isCurrentMonth ? "bg-[#fafafa]/50 text-[#a1a1aa]" : ""
									} ${today ? "bg-blue-50/20" : ""}`}
								>
									<div className="flex items-center justify-between">
										<span
											className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
												today
													? "bg-[#09090b] text-white"
													: !isCurrentMonth
														? "text-[#a1a1aa]"
														: "text-[#09090b]"
											}`}
										>
											{format(day, "d")}
										</span>
										{dayEvents.length > 0 && (
											<span className="text-[10px] font-medium text-[#71717a]">
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
												className={`text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-80 cursor-pointer ${
													event.status === "approved"
														? "bg-emerald-100 text-emerald-900 border border-emerald-200"
														: event.status === "closed"
															? "bg-rose-100 text-rose-900 border border-rose-200"
															: "bg-amber-100 text-amber-900 border border-amber-200"
												}`}
												title={`${event.title} (${event.assetName})`}
											>
												{event.requesterName} - {event.assetName}
											</button>
										))}
										{dayEvents.length > 3 && (
											<span className="text-[9px] text-[#71717a] font-semibold pl-1">
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
				<div className="border border-[#e4e4e7] rounded-lg overflow-x-auto">
					<div className="min-w-[700px] flex flex-col">
						{/* Week Header */}
						<div className="grid grid-cols-8 bg-[#fafafa] border-b border-[#e4e4e7] text-center text-xs font-semibold py-2">
							<div className="text-[11px] text-[#71717a]">Jam (WIB)</div>
							{weekDays.map((day) => (
								<div
									key={day.toISOString()}
									className={`flex flex-col gap-0.5 ${
										isToday(day) ? "text-blue-600 font-bold" : "text-[#09090b]"
									}`}
								>
									<span className="text-[10px] text-[#71717a] uppercase">
										{format(day, "EEE")}
									</span>
									<span className="text-xs">{format(day, "dd MMM")}</span>
								</div>
							))}
						</div>

						{/* Hours Rows */}
						<div className="divide-y divide-[#e4e4e7] bg-white">
							{hoursRange.map((hour) => (
								<div
									key={hour}
									className="grid grid-cols-8 min-h-[50px] divide-x divide-[#e4e4e7]"
								>
									<div className="text-[11px] font-mono text-[#71717a] p-2 bg-[#fafafa]/50 text-center">
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
														className={`text-left text-[10px] p-1 rounded font-medium truncate transition-opacity hover:opacity-85 cursor-pointer ${
															event.status === "approved"
																? "bg-emerald-100 text-emerald-900 border border-emerald-200"
																: event.status === "closed"
																	? "bg-rose-100 text-rose-900 border border-rose-200"
																	: "bg-amber-100 text-amber-900 border border-amber-200"
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
