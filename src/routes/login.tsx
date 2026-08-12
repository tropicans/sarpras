import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "#/lib/auth-client";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/client.server";
import { users } from "#/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "#/lib/auth.middleware";

// Server function to mark password reset complete in DB
export const completePasswordResetFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await db.update(users).set({ mustResetPassword: false }).where(eq(users.id, context.user.id));
    return { success: true };
  });

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset sub-flow state
  const [showReset, setShowReset] = useState(false);
  const [oldPassword, setOldPassword] = useState(""); // to pass to changePassword
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  // Redirect if already logged in and doesn't need reset
  useEffect(() => {
    if (session?.user) {
      if (session.user.mustResetPassword) {
        setShowReset(true);
        setOldPassword(password); // if they just logged in, we have it
      } else {
        navigate({ to: "/admin" });
      }
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError("Could not authenticate. Please check your email and password and try again.");
      } else if (result.data?.user?.mustResetPassword) {
        setOldPassword(password);
        setShowReset(true);
      } else {
        navigate({ to: "/admin" });
      }
    } catch (err) {
      setError("Could not authenticate. Please check your email and password and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setResetError(null);

    try {
      // 1. Change password using Better Auth client SDK
      const changeRes = await authClient.changePassword({
        newPassword,
        currentPassword: oldPassword || password, // fallback
        revokeOtherSessions: true,
      });

      if (changeRes.error) {
        setResetError(changeRes.error.message || "Failed to update password. Please try again.");
      } else {
        // 2. Call server function to flip mustResetPassword flag to false
        await completePasswordResetFn();
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      setResetError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-[#09090b] font-medium text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#fafafa] font-sans">
      <div className="w-full max-w-[400px] p-6 bg-white border border-[#e4e4e7] rounded-xl shadow-sm">
        {!showReset ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-center mb-2">
              <h2 className="text-xl font-semibold text-[#09090b]">Sign In</h2>
              <p className="text-xs text-[#71717a]">Sarpras PPKASN Administration Boundary</p>
            </div>

            {error && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-md text-left">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-medium text-[#71717a]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent disabled:opacity-50"
                placeholder="admin@ppkasn.go.id"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-medium text-[#71717a]">
                Password
              </label>
              <input
                id="password"
                type="password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="mt-2 w-full py-2 bg-[#09090b] text-white rounded-md text-sm font-medium hover:bg-[#27272a] focus:outline-none focus:ring-2 focus:ring-[#09090b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-center mb-2">
              <h2 className="text-xl font-semibold text-[#09090b]">Reset Password</h2>
              <p className="text-xs text-[#71717a]">First sign-in password reset required</p>
            </div>

            {resetError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-md text-left">
                {resetError}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="newPassword" className="text-xs font-medium text-[#71717a]">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                disabled={loading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-xs font-medium text-[#71717a]">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="mt-2 w-full py-2 bg-[#09090b] text-white rounded-md text-sm font-medium hover:bg-[#27272a] focus:outline-none focus:ring-2 focus:ring-[#09090b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Updating..." : "Reset Password & Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
