import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const checkBookingSearchSchema = z.object({
	ref: z.string().optional(),
});

export const Route = createFileRoute("/check-booking")({
	validateSearch: (search: Record<string, unknown>) =>
		checkBookingSearchSchema.parse(search),
	beforeLoad: ({ search }) => {
		if (search.ref && search.ref.trim()) {
			throw redirect({
				to: "/status/$ref",
				params: { ref: search.ref.trim() },
			});
		}
		throw redirect({
			to: "/status",
		});
	},
});
