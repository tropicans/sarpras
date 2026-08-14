import React from "react";
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
			border: "border-[#e4e4e7]",
			bg: "bg-[#fafafa]",
			iconBg: "bg-[#e4e4e7] text-[#09090b]",
			valColor: "text-[#09090b]",
		},
		amber: {
			border: "border-amber-200",
			bg: "bg-amber-50/50",
			iconBg: "bg-amber-100 text-amber-800",
			valColor: "text-amber-900",
		},
		emerald: {
			border: "border-emerald-200",
			bg: "bg-emerald-50/50",
			iconBg: "bg-emerald-100 text-emerald-800",
			valColor: "text-emerald-900",
		},
		blue: {
			border: "border-blue-200",
			bg: "bg-blue-50/50",
			iconBg: "bg-blue-100 text-blue-800",
			valColor: "text-blue-900",
		},
		rose: {
			border: "border-rose-200",
			bg: "bg-rose-50/50",
			iconBg: "bg-rose-100 text-rose-800",
			valColor: "text-rose-900",
		},
	}[variant];

	return (
		<div
			className={`p-5 rounded-xl border ${variantStyles.border} ${variantStyles.bg} flex items-center justify-between shadow-xs transition-all hover:shadow-sm`}
		>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-[#71717a]">{title}</span>
				<span className={`text-3xl font-bold ${variantStyles.valColor}`}>
					{value}
				</span>
				{subtext && <span className="text-[11px] text-[#71717a]">{subtext}</span>}
			</div>
			<div className={`p-3 rounded-lg ${variantStyles.iconBg}`}>
				<Icon size={24} />
			</div>
		</div>
	);
}
