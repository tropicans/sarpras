export const ROLE_RANK = {
	admin: 3,
	operator: 2,
	pimpinan: 1,
} as const;

export type UserRole = keyof typeof ROLE_RANK;

export function resolveEffectiveRole(user: {
	email: string;
	role?: string | null;
}): UserRole {
	const adminEmails = (process.env.ADMIN_DEFAULT_EMAIL || "admin@ppkasn.go.id")
		.split(",")
		.map((e) => e.trim().toLowerCase());

	if (user.email && adminEmails.includes(user.email.toLowerCase())) {
		return "admin";
	}

	const role = (user.role || "operator") as UserRole;
	return ROLE_RANK[role] ? role : "operator";
}
