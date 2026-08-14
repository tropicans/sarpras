import { Calendar, Check, FileCheck, User } from "lucide-react";

interface WizardStepperProps {
	currentStep: number; // 1, 2, 3
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
	const steps = [
		{ id: 1, label: "Jadwal & Peserta", icon: Calendar },
		{ id: 2, label: "Data Pemohon", icon: User },
		{ id: 3, label: "Konfirmasi", icon: FileCheck },
	];

	return (
		<div className="w-full py-4">
			<div className="flex items-center justify-between max-w-xl mx-auto relative">
				{/* Connecting Bar */}
				<div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-border -z-0" />
				<div
					className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 -z-0"
					style={{
						width:
							currentStep === 1
								? "0%"
								: currentStep === 2
									? "50%"
									: "calc(100% - 4rem)",
					}}
				/>

				{steps.map((step) => {
					const Icon = step.icon;
					const isDone = currentStep > step.id;
					const isCurrent = currentStep === step.id;

					return (
						<div
							key={step.id}
							className="flex flex-col items-center gap-2 relative z-10"
						>
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all font-bold text-sm ${
									isDone
										? "border-primary bg-primary text-primary-foreground"
										: isCurrent
											? "border-primary bg-card text-primary shadow-xs ring-4 ring-primary/10"
											: "border-border bg-card text-muted-foreground"
								}`}
							>
								{isDone ? (
									<Check className="h-5 w-5" />
								) : (
									<Icon className="h-4 w-4" />
								)}
							</div>
							<span
								className={`text-xs font-semibold text-center whitespace-nowrap ${
									isCurrent
										? "text-primary"
										: isDone
											? "text-foreground"
											: "text-muted-foreground"
								}`}
							>
								{step.label}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
