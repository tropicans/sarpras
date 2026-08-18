import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	Activity,
	BedDouble,
	Building2,
	Car,
	DoorOpen,
	Package,
	Users,
} from "lucide-react";
import { useState } from "react";
import {
	RequesterStep,
	type RequesterStepData,
} from "#/components/booking/requester-step";
import { ReviewStep } from "#/components/booking/review-step";
import {
	type AdditionalRoomSelection,
	ScheduleStep,
	type ScheduleStepData,
} from "#/components/booking/schedule-step";
import { SuccessCard } from "#/components/booking/success-card";
import { WizardStepper } from "#/components/booking/wizard-stepper";
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";
import {
	getPublicAssetByIdFn,
	getPublicAssetsListFn,
} from "#/lib/booking/public-fns.functions";
import { submitBatchBookingRequestFn } from "#/lib/booking/server-fns.functions";
import { ASSET_TYPE_LABELS, type AssetType } from "#/lib/booking/types";

export const Route = createFileRoute("/book/$assetId")({
	loader: async ({ params }) => {
		const [asset, allAssets] = await Promise.all([
			getPublicAssetByIdFn({
				data: { assetId: params.assetId },
			}),
			getPublicAssetsListFn(),
		]);
		if (!asset) {
			throw notFound();
		}
		return { asset, availableAssets: allAssets || [] };
	},
	component: BookingWizardPage,
});

function BookingWizardPage() {
	const { asset, availableAssets } = Route.useLoaderData();
	const isRoom = asset.type === "room";
	const typeLabel = ASSET_TYPE_LABELS[asset.type as AssetType] || asset.type;

	const getTypeIcon = () => {
		switch (asset.type) {
			case "room":
				return <DoorOpen className="h-3.5 w-3.5" />;
			case "dormitory":
				return <BedDouble className="h-3.5 w-3.5" />;
			case "vehicle":
				return <Car className="h-3.5 w-3.5" />;
			case "field":
				return <Activity className="h-3.5 w-3.5" />;
			case "equipment":
				return <Package className="h-3.5 w-3.5" />;
			default:
				return <Building2 className="h-3.5 w-3.5" />;
		}
	};

	// Wizard State
	const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | "success">(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");
	const [bookedRoomNames, setBookedRoomNames] = useState<string[]>([asset.name]);

	// Step 1: Schedule state
	const [scheduleData, setScheduleData] = useState<ScheduleStepData>({
		startDate: "",
		endDate: "",
		attendance: isRoom ? Math.min(10, asset.capacity) : 1,
	});

	const [additionalRooms, setAdditionalRooms] = useState<
		AdditionalRoomSelection[]
	>([]);

	// Step 2: Requester state
	const [requesterData, setRequesterData] = useState<RequesterStepData>({
		requesterName: "",
		requesterEmail: "",
		requesterPhone: "",
		requesterOrganization: "",
		purpose: "",
	});

	const handleScheduleChange = (updated: Partial<ScheduleStepData>) => {
		setScheduleData((prev) => ({ ...prev, ...updated }));
	};

	const handleAddRoom = (newAsset: any) => {
		setAdditionalRooms((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				asset: newAsset,
				schedule: {
					startDate: scheduleData.startDate,
					endDate: scheduleData.endDate,
					startDateOnly: scheduleData.startDateOnly,
					endDateOnly: scheduleData.endDateOnly,
					dateOnly: scheduleData.dateOnly,
					startTime: scheduleData.startTime,
					endTime: scheduleData.endTime,
					attendance: Math.min(10, newAsset.capacity),
				},
				available: true,
			},
		]);
	};

	const handleRemoveRoom = (selectionId: string) => {
		setAdditionalRooms((prev) => prev.filter((r) => r.id !== selectionId));
	};

	const handleUpdateAdditionalRoom = (
		selectionId: string,
		updated: Partial<ScheduleStepData>,
	) => {
		setAdditionalRooms((prev) =>
			prev.map((r) =>
				r.id === selectionId
					? { ...r, schedule: { ...r.schedule, ...updated } }
					: r,
			),
		);
	};

	const handleRequesterChange = (updated: Partial<RequesterStepData>) => {
		setRequesterData((prev) => ({ ...prev, ...updated }));
	};

	const handleSubmitBooking = async () => {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const items = [
				{
					assetId: asset.id,
					attendance: scheduleData.attendance,
					startDate: scheduleData.startDate,
					endDate: scheduleData.endDate,
				},
				...additionalRooms.map((r) => ({
					assetId: r.asset.id,
					attendance: r.schedule.attendance,
					startDate: r.schedule.startDate,
					endDate: r.schedule.endDate,
				})),
			];

			const res = await submitBatchBookingRequestFn({
				data: {
					items,
					requesterName: requesterData.requesterName,
					requesterEmail: requesterData.requesterEmail,
					requesterPhone: requesterData.requesterPhone,
					requesterOrganization: requesterData.requesterOrganization,
					purpose: requesterData.purpose,
					timezone: "Asia/Jakarta",
				},
			});

			const names = [asset.name, ...additionalRooms.map((r) => r.asset.name)];
			setBookedRoomNames(names);
			setConfirmedBookingId(res.groupId || res.bookings[0]?.id || "");
			setCurrentStep("success");
		} catch (err: any) {
			let message = err?.message || "Terjadi kesalahan saat mengirim pengajuan.";
			try {
				const parsed = JSON.parse(message);
				if (Array.isArray(parsed) && parsed.length > 0) {
					message = parsed.map((p: any) => p.message || p.code).join(", ");
				}
			} catch {}
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const totalRooms = 1 + additionalRooms.length;

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
			<PublicHeader />

			<main className="flex-1 py-8 sm:py-12">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
					{/* Breadcrumb Nav */}
					<nav
						aria-label="Breadcrumb"
						className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
					>
						<Link to="/" className="hover:text-foreground transition-colors">
							ROOT
						</Link>
						<span>/</span>
						<a
							href="/#katalog"
							className="hover:text-foreground transition-colors"
						>
							KATALOG
						</a>
						<span>/</span>
						<span className="text-foreground font-semibold truncate">
							BOOKING // {asset.name}{" "}
							{additionalRooms.length > 0 && `(+${additionalRooms.length} Ruangan)`}
						</span>
					</nav>

					{currentStep !== "success" && (
						<>
							{/* Asset Header Info Card */}
							<div className="rounded-lg border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<span className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
											{getTypeIcon()}
											<span>{typeLabel.toUpperCase()}</span>
										</span>
										<span className="text-xs text-muted-foreground font-mono">
											#{asset.id.slice(0, 8)} &bull;{" "}
											{asset.location || "Gedung Utama PPKASN"}
										</span>
										{additionalRooms.length > 0 && (
											<span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
												MULTI-ROOM ({totalRooms} FASILITAS)
											</span>
										)}
									</div>
									<h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
										Formulir Peminjaman: {asset.name}
									</h1>
								</div>

								<div className="flex items-center gap-2 font-mono text-xs">
									<div className="flex items-center gap-1.5 rounded border border-border bg-muted/40 px-3 py-1.5">
										<Users className="h-3.5 w-3.5 text-primary" />
										<span className="font-semibold">
											Kapasitas Utama {asset.capacity}{" "}
											{asset.type === "vehicle" || asset.type === "equipment"
												? "Unit"
												: "Pax"}
										</span>
									</div>
								</div>
							</div>

							{/* Wizard Stepper */}
							<WizardStepper currentStep={currentStep} />

							{/* Step Content */}
							{currentStep === 1 && (
								<ScheduleStep
									asset={asset}
									data={scheduleData}
									onChange={handleScheduleChange}
									additionalRooms={additionalRooms}
									onAddRoom={handleAddRoom}
									onRemoveRoom={handleRemoveRoom}
									onUpdateAdditionalRoom={handleUpdateAdditionalRoom}
									availableAssets={availableAssets}
									onNext={() => setCurrentStep(2)}
								/>
							)}

							{currentStep === 2 && (
								<RequesterStep
									data={requesterData}
									onChange={handleRequesterChange}
									onNext={() => setCurrentStep(3)}
									onBack={() => setCurrentStep(1)}
								/>
							)}

							{currentStep === 3 && (
								<ReviewStep
									asset={asset}
									schedule={scheduleData}
									additionalRooms={additionalRooms}
									requester={requesterData}
									isSubmitting={isSubmitting}
									errorMessage={submitError}
									onSubmit={handleSubmitBooking}
									onBack={() => setCurrentStep(2)}
								/>
							)}
						</>
					)}

					{/* Success Card on Completion */}
					{currentStep === "success" && (
						<SuccessCard
							bookingId={confirmedBookingId}
							assetName={bookedRoomNames.join(", ")}
						/>
					)}
				</div>
			</main>

			<PublicFooter />
		</div>
	);
}

