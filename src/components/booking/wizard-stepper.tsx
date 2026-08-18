import { Calendar, Check, FileCheck, User } from "lucide-react";

interface WizardStepperProps {
	currentStep: number; // 1, 2, 3
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
	const steps = [
		{ id: 1, label: "01 // JADWAL & KAPASITAS", icon: Calendar },
		{ id: 2, label: "02 // DATA PEMOHON", icon: User },
		{ id: 3, label: "03 // REVIEW & SUBMIT", icon: FileCheck },
	];

	return (
		<div className="w-full py-2">
			<div className="grid grid-cols-3 gap-2 font-mono text-xs">
				{steps.map((step) => {
					const isDone = currentStep > step.id;
					const isCurrent = currentStep === step.id;

					return (
						<div
							key={step.id}
							className={`flex items-center gap-2 rounded-md border p-2.5 transition-all ${
								isCurrent
									? "border-primary bg-primary/10 text-primary font-semibold"
									: isDone
										? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
										: "border-border bg-card text-muted-foreground"
							}`}
						>
							<div
								className={`flex h-5 w-5 items-center justify-center rounded text-[11px] shrink-0 font-bold ${
									isDone
										? "bg-emerald-500 text-white"
										: isCurrent
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{isDone ? <Check className="h-3 w-3" /> : step.id}
							</div>
							<span className="truncate text-[11px]">{step.label}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
