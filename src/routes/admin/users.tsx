import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/client.server";
import { users, sessions, auditLogs } from "#/db/schema";
import { authMiddleware, requireMinRole } from "#/lib/auth.middleware";
import { eq, desc } from "drizzle-orm";
import { useEffect, useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";

export const getAdminsListFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  });

export const deactivateUserFn = createServerFn({ method: "POST" })
  .middleware([requireMinRole("admin")])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId, context }) => {
    // 1. Update user status
    await db.update(users).set({ status: "inactive" }).where(eq(users.id, userId));

    // 2. Terminate sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));

    // 3. Write audit log
    await db.insert(auditLogs).values({
      actorId: context.user.id,
      actorType: "user",
      action: "user.deactivate",
      entityType: "user",
      entityId: userId,
      metadata: {
        deactivatedBy: context.user.id,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true };
  });

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
});

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string | Date;
};

function AdminUsersComponent() {
  const { user: currentUser } = Route.useRouteContext();
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    getAdminsListFn()
      .then((data) => setUserList(data as any))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDeactivate = (user: AdminUser) => {
    if (currentUser.role !== "admin") {
      alert("Only users with the 'admin' role can deactivate accounts.");
      return;
    }
    if (user.id === currentUser.id) {
      alert("You cannot deactivate your own account.");
      return;
    }
    setSelectedUser(user);
    setShowConfirm(true);
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deactivateUserFn({ data: selectedUser.id });
      setShowConfirm(false);
      setSelectedUser(null);
      fetchUsers(); // reload
    } catch (err) {
      alert("Failed to deactivate account. Ensure you have admin privileges.");
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination
  const totalItems = userList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = userList.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-sm font-medium text-[#71717a] animate-pulse">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#09090b]">User Management</h2>
          <p className="text-xs text-[#71717a]">Administrators access control and deactivation</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-sm rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchUsers} className="ml-auto underline font-medium">Retry</button>
        </div>
      )}

      {/* Users Table */}
      <div className="border border-[#e4e4e7] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e4e4e7] text-xs font-semibold text-[#71717a]">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] text-sm">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#71717a]">
                    No accounts found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#fafafa]">
                    <td className="p-4 font-medium text-[#09090b]">{user.name}</td>
                    <td className="p-4 text-[#71717a]">{user.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-[#e4e4e7] text-[#09090b] text-[10px] font-semibold uppercase rounded">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                          user.status === "active"
                            ? "bg-[#ecfdf5] text-[#059669]"
                            : "bg-[#fef2f2] text-[#e11d48]"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {user.status === "active" && user.id !== currentUser.id && (
                        <button
                          onClick={() => handleOpenDeactivate(user)}
                          disabled={currentUser.role !== "admin"}
                          className="p-2 text-[#71717a] hover:text-[#e11d48] rounded-md hover:bg-[#fef2f2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#71717a] bg-[#fafafa]">
          <span>
            Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} accounts
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-[#e4e4e7] bg-white rounded-md font-medium hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-[#e4e4e7] bg-white rounded-md font-medium hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirm && selectedUser && (
        <div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[450px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-[#09090b]">Deactivate User</h3>
              <p className="text-xs text-[#71717a]">
                Deactivate User: Are you sure you want to deactivate this administrator account? This will immediately terminate all active sessions on all devices.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="px-3 py-1.5 border border-[#e4e4e7] bg-white hover:bg-[#fafafa] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-[#e11d48] text-white hover:bg-[#be123c] text-xs font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? "Deactivating..." : "Deactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
