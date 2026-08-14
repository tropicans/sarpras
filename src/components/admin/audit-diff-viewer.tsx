import {
	ArrowRight,
	Check,
	ChevronDown,
	ChevronRight,
	Code2,
	Info,
} from "lucide-react";
import React, { useState } from "react";

interface AuditDiffViewerProps {
	action: string;
	entityType: string;
	entityId?: string | null;
	metadata: Record<string, any> | null;
}

export function AuditDiffViewer({
	action,
	entityType,
	entityId,
	metadata,
}: AuditDiffViewerProps) {
	const [showRawJson, setShowRawJson] = useState(false);

	if (!metadata) {
		return (
			<span className="text-[11px] text-[#a1a1aa] italic">
				Tidak ada metadata perubahan
			</span>
		);
	}

	const oldStatus = metadata.oldStatus;
	const newStatus = metadata.newStatus;
	const rejectionReason = metadata.rejectionReason;
	const reason = metadata.reason;

	return (
		<div className="flex flex-col gap-2 text-xs">
			{/* Status Transition Diff */}
			{oldStatus && newStatus && (
				<div className="flex items-center gap-2 font-medium">
					<span className="text-[#71717a]">Status:</span>
					<span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded font-semibold uppercase text-[10px]">
						{oldStatus}
					</span>
					<ArrowRight size={13} className="text-[#a1a1aa]" />
					<span
						className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
							newStatus === "approved"
								? "bg-emerald-100 text-emerald-800"
								: newStatus === "rejected"
									? "bg-rose-100 text-rose-800"
									: "bg-amber-100 text-amber-800"
						}`}
					>
						{newStatus}
					</span>
				</div>
			)}

			{/* Rejection / Cancellation Reason */}
			{(rejectionReason || reason) && (
				<div className="flex flex-col gap-0.5 bg-rose-50/70 border border-rose-200 rounded p-2 text-rose-900">
					<span className="font-bold text-[10px] uppercase">
						Alasan / Keterangan:
					</span>
					<p className="italic text-[11px]">"{rejectionReason || reason}"</p>
				</div>
			)}

			{/* Creation / Entity info */}
			{action === "booking.create" && (
				<div className="text-[11px] text-[#71717a]">
					<span>Peminjaman Baru Dibuat • Pemohon: </span>
					<strong className="text-[#09090b]">
						{metadata.requesterEmail}
					</strong>
					{metadata.attendance && (
						<span> ({metadata.attendance} orang)</span>
					)}
				</div>
			)}

			{/* Expandable JSON Inspector */}
			<div className="pt-1">
				<button
					type="button"
					onClick={() => setShowRawJson(!showRawJson)}
					className="text-[11px] font-medium text-[#71717a] hover:text-[#09090b] flex items-center gap-1 cursor-pointer"
				>
					<Code2 size={13} />
					<span>{showRawJson ? "Sembunyikan JSON" : "Lihat JSON Mentah"}</span>
					{showRawJson ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
				</button>

				{showRawJson && (
					<pre className="mt-2 p-2.5 bg-[#18181b] text-[#f4f4f5] rounded-lg text-[10px] font-mono overflow-x-auto border border-[#27272a]">
						<code>{JSON.stringify(metadata, null, 2)}</code>
					</pre>
				)}
			</div>
		</div>
	);
}
