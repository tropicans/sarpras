import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
	title: string;
	value: number | string;
	icon: LucideIcon;
	subtext?: string;
	variant?: "default" | "amber" | "emerald" | "blue" | "rose";
}

export function KpiCard({
	title,
	value,
	icon: Icon,
	subtext,
	variant = "default",
}: KpiCardProps) {
	const variantStyles = {
		default: {
			border: "border-border",
			bg: "bg-card",
			iconBg: "bg-muted text-foreground",
			valColor: "text-foreground",
		},
		amber: {
			border: "border-amber-500/30",
			bg: "bg-amber-500/10",
			iconBg: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
			valColor: "text-amber-800 dark:text-amber-300",
		},
		emerald: {
			border: "border-emerald-500/30",
			bg: "bg-emerald-500/10",
			iconBg: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
			valColor: "text-emerald-800 dark:text-emerald-300",
		},
		blue: {
			border: "border-sky-500/30",
			bg: "bg-sky-500/10",
			iconBg: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
			valColor: "text-sky-800 dark:text-sky-300",
		},
		rose: {
			border: "border-rose-500/30",
			bg: "bg-rose-500/10",
			iconBg: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
			valColor: "text-rose-800 dark:text-rose-300",
		},
	}[variant];

	return (
		<div
			className={`p-5 rounded-xl border ${variantStyles.border} ${variantStyles.bg} flex items-center justify-between shadow-xs transition-all hover:shadow-sm`}
		>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-muted-foreground">
					{title}
				</span>
				<span className={`text-3xl font-bold ${variantStyles.valColor}`}>
					{value}
				</span>
				{subtext && (
					<span className="text-[11px] text-muted-foreground">{subtext}</span>
				)}
			</div>
			<div className={`p-3 rounded-lg ${variantStyles.iconBg}`}>
				<Icon size={24} />
			</div>
		</div>
	);
}
