import {
	Link,
	createFileRoute,
	notFound,
} from "@tanstack/react-router";
import {
	BedDouble,
	Building2,
	ChevronRight,
	DoorOpen,
	MapPin,
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
import { PublicFooter } from "#/components/public/public-footer";
import { PublicHeader } from "#/components/public/public-header";
import { getPublicAssetByIdFn } from "#/lib/booking/public-fns.server";
import { submitBookingRequestFn } from "#/lib/booking/server-fns.server";
import { WizardStepper } from "#/components/booking/wizard-stepper";

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
				err.message ||
					"Terjadi kesalahan saat memproses permohonan. Silakan coba kembali.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
			<PublicHeader />

			<main className="flex-1 py-8 sm:py-12">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
					{/* Breadcrumbs */}
					<nav className="flex items-center gap-2 text-xs text-muted-foreground">
						<Link to="/" className="hover:text-foreground transition-colors">
							Beranda
						</Link>
						<ChevronRight className="h-3.5 w-3.5" />
						<a href="/#katalog" className="hover:text-foreground transition-colors">
							Katalog Sarana
						</a>
						<ChevronRight className="h-3.5 w-3.5" />
						<span className="text-foreground font-medium truncate">
							Pengajuan {asset.name}
						</span>
					</nav>

					{currentStep !== "success" && (
						<>
							{/* Asset Header Info Card */}
							<div className="rounded-2xl border border-border/80 bg-gradient-to-r from-primary/5 via-card to-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="space-y-1.5">
									<div className="flex items-center gap-2">
										<span
											className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
												isRoom
													? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
													: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
											}`}
										>
											{isRoom ? (
												<DoorOpen className="h-3.5 w-3.5" />
											) : (
												<BedDouble className="h-3.5 w-3.5" />
											)}
											{isRoom ? "Ruang Rapat" : "Asrama / Wisma"}
										</span>
										<span className="text-xs text-muted-foreground">
											&bull; {asset.location || "Gedung Utama PPKASN"}
										</span>
									</div>
									<h1 className="text-2xl font-bold text-foreground">
										{asset.name}
									</h1>
								</div>

								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold">
										<Users className="h-4 w-4 text-primary" />
										<span>Kapasitas {asset.capacity} Orang</span>
									</div>
								</div>
							</div>

							{/* Wizard Stepper */}
							<WizardStepper
								currentStep={currentStep === "success" ? 3 : currentStep}
							/>

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
