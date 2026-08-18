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
	ScheduleStep,
	type ScheduleStepData,
} from "#/components/booking/schedule-step";
import { SuccessCard } from "#/components/booking/success-card";
import { WizardStepper } from "#/components/booking/wizard-stepper";
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";
import { getPublicAssetByIdFn } from "#/lib/booking/public-fns.functions";
import { submitBookingRequestFn } from "#/lib/booking/server-fns.functions";
import { ASSET_TYPE_LABELS, type AssetType } from "#/lib/booking/types";

export const Route = createFileRoute("/book/$assetId")({
	loader: async ({ params }) => {
		const asset = await getPublicAssetByIdFn({
			data: { assetId: params.assetId },
		});
		if (!asset) {
			throw notFound();
		}
		return { asset };
	},
	component: BookingWizardPage,
});

function BookingWizardPage() {
	const { asset } = Route.useLoaderData();
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

	// Step 1: Schedule state
	const [scheduleData, setScheduleData] = useState<ScheduleStepData>({
		startDate: "",
		endDate: "",
		attendance: isRoom ? Math.min(10, asset.capacity) : 1,
	});

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

	const handleRequesterChange = (updated: Partial<RequesterStepData>) => {
		setRequesterData((prev) => ({ ...prev, ...updated }));
	};

	const handleSubmitBooking = async () => {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const res = await submitBookingRequestFn({
				data: {
					assetId: asset.id,
					requesterName: requesterData.requesterName,
					requesterEmail: requesterData.requesterEmail,
					requesterPhone: requesterData.requesterPhone,
					requesterOrganization: requesterData.requesterOrganization,
					purpose: requesterData.purpose,
					attendance: scheduleData.attendance,
					startDate: scheduleData.startDate,
					endDate: scheduleData.endDate,
					timezone: "Asia/Jakarta",
				},
			});

			setConfirmedBookingId(res.id);
			setCurrentStep("success");
		} catch (err: any) {
			setSubmitError(
				err.message || "Terjadi kesalahan saat mengirim pengajuan.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

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
							BOOKING // {asset.name}
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
											#{asset.id.slice(0, 8)} &bull; {asset.location || "Gedung Utama PPKASN"}
										</span>
									</div>
									<h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
										Formulir Peminjaman: {asset.name}
									</h1>
								</div>

								<div className="flex items-center gap-2 font-mono text-xs">
									<div className="flex items-center gap-1.5 rounded border border-border bg-muted/40 px-3 py-1.5">
										<Users className="h-3.5 w-3.5 text-primary" />
										<span className="font-semibold">
											Kapasitas {asset.capacity}{" "}
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
							assetName={asset.name}
						/>
					)}
				</div>
			</main>

			<PublicFooter />
		</div>
	);
}
