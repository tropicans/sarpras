export interface ExtendedUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	role?: "admin" | "operator" | "pimpinan" | string;
	status?: "active" | "inactive" | string;
	mustResetPassword?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

declare module "better-auth" {
	interface User {
		role?: "admin" | "operator" | "pimpinan" | string;
		status?: "active" | "inactive" | string;
		mustResetPassword?: boolean;
	}
}

declare module "better-auth/types" {
	interface User {
		role?: "admin" | "operator" | "pimpinan" | string;
		status?: "active" | "inactive" | string;
		mustResetPassword?: boolean;
	}
}
