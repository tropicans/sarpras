import {
	ArrowRight,
	ChevronDown,
	ChevronRight,
	Code2,
} from "lucide-react";
import { useState } from "react";

interface AuditDiffViewerProps {
	action: string;
	entityType: string;
	entityId?: string | null;
	metadata: Record<string, any> | null;
}

export function AuditDiffViewer({
	action,
	metadata,
}: AuditDiffViewerProps) {
	const [showRawJson, setShowRawJson] = useState(false);

	if (!metadata) {
		return (
			<span className="text-[11px] text-muted-foreground/60 italic">
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
					<span className="text-muted-foreground">Status:</span>
					<span className="px-2 py-0.5 bg-muted text-muted-foreground rounded font-semibold uppercase text-[10px] border border-border">
						{oldStatus}
					</span>
					<ArrowRight size={13} className="text-muted-foreground/60" />
					<span
						className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] border ${
							newStatus === "approved"
								? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
								: newStatus === "rejected"
									? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
									: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
						}`}
					>
						{newStatus}
					</span>
				</div>
			)}

			{/* Rejection / Cancellation Reason */}
			{(rejectionReason || reason) && (
				<div className="flex flex-col gap-0.5 bg-rose-500/10 border border-rose-500/20 rounded p-2 text-rose-800 dark:text-rose-300">
					<span className="font-bold text-[10px] uppercase">
						Alasan / Keterangan:
					</span>
					<p className="italic text-[11px]">"{rejectionReason || reason}"</p>
				</div>
			)}

			{/* Creation / Entity info */}
			{action === "booking.create" && (
				<div className="text-[11px] text-muted-foreground">
					<span>Peminjaman Baru Dibuat • Pemohon: </span>
					<strong className="text-foreground">{metadata.requesterEmail}</strong>
					{metadata.attendance && <span> ({metadata.attendance} orang)</span>}
				</div>
			)}

			{/* Expandable JSON Inspector */}
			<div className="pt-1">
				<button
					type="button"
					onClick={() => setShowRawJson(!showRawJson)}
					className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
				>
					<Code2 size={13} />
					<span>{showRawJson ? "Sembunyikan JSON" : "Lihat JSON Mentah"}</span>
					{showRawJson ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
				</button>

				{showRawJson && (
					<pre className="mt-2 p-2.5 bg-zinc-900 dark:bg-black text-zinc-100 rounded-lg text-[10px] font-mono overflow-x-auto border border-border">
						<code>{JSON.stringify(metadata, null, 2)}</code>
					</pre>
				)}
			</div>
		</div>
	);
}
