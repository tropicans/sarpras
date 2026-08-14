import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/approval")({
	beforeLoad: () => {
		throw redirect({
			to: "/admin/bookings",
		});
	},
});
