import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db } from "#/db/client.server";
import { assets, assetAvailability, assetClosures, auditLogs } from "#/db/schema";
import { authMiddleware, requireMinRole } from "#/lib/auth.middleware";
import { eq, desc, and } from "drizzle-orm";
import { useEffect, useState } from "react";
import { toDate, formatInTimeZone } from "date-fns-tz";
import { AlertCircle, Plus, Edit2, Archive, Calendar, Clock, X, Check } from "lucide-react";

// --- Server Functions ---

export const getAssetsListFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    return await db.select().from(assets).orderBy(desc(assets.createdAt));
  });

export const getAssetSchedulesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((assetId: string) => assetId)
  .handler(async ({ data: assetId }) => {
    const availabilityList = await db
      .select()
      .from(assetAvailability)
      .where(eq(assetAvailability.assetId, assetId));
    
    const closuresList = await db
      .select()
      .from(assetClosures)
      .where(eq(assetClosures.assetId, assetId));

    return {
      availability: availabilityList,
      closures: closuresList,
    };
  });

export const saveAssetFn = createServerFn({ method: "POST" })
  .middleware([requireMinRole("operator")]) // admin and operator can write
  .validator((data: { id?: string; name: string; type: string; location?: string; capacity: number; status: string }) => data)
  .handler(async ({ data, context }) => {
    if (data.capacity <= 0) {
      throw new Error("Capacity must be positive");
    }

    let assetId = data.id;

    if (assetId) {
      // Update
      await db.update(assets).set({
        name: data.name,
        type: data.type,
        location: data.location || null,
        capacity: data.capacity,
        status: data.status,
        updatedAt: new Date(),
      }).where(eq(assets.id, assetId));

      await db.insert(auditLogs).values({
        actorId: context.user.id,
        actorType: "user",
        action: "asset.update",
        entityType: "asset",
        entityId: assetId,
        metadata: { updatedValues: data },
      });
    } else {
      // Create
      const inserted = await db.insert(assets).values({
        name: data.name,
        type: data.type,
        location: data.location || null,
        capacity: data.capacity,
        status: data.status,
      }).returning();
      
      assetId = inserted[0].id;

      await db.insert(auditLogs).values({
        actorId: context.user.id,
        actorType: "user",
        action: "asset.create",
        entityType: "asset",
        entityId: assetId,
        metadata: { createdValues: data },
      });
    }

    return { assetId };
  });

export const archiveAssetFn = createServerFn({ method: "POST" })
  .middleware([requireMinRole("operator")])
  .validator((assetId: string) => assetId)
  .handler(async ({ data: assetId, context }) => {
    // Soft delete: update status to 'archived' (D-12)
    await db.update(assets).set({ status: "archived" }).where(eq(assets.id, assetId));

    await db.insert(auditLogs).values({
      actorId: context.user.id,
      actorType: "user",
      action: "asset.archive",
      entityType: "asset",
      entityId: assetId,
      metadata: { archivedBy: context.user.id },
    });

    return { success: true };
  });

export const saveAssetSchedulesFn = createServerFn({ method: "POST" })
  .middleware([requireMinRole("operator")])
  .validator((data: {
    assetId: string;
    availability: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>;
    closures: Array<{ date: string }>;
  }) => data)
  .handler(async ({ data, context }) => {
    // Validate Operating availability hours in Asia/Jakarta (D-11)
    for (const slot of data.availability) {
      if (slot.openTime >= slot.closeTime) {
        throw new Error("Close time must be strictly after open time.");
      }
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new Error("Day of week must be between 0 (Sunday) and 6 (Saturday).");
      }
    }

    // Save transactionally
    await db.transaction(async (tx) => {
      // 1. Availability
      await tx.delete(assetAvailability).where(eq(assetAvailability.assetId, data.assetId));
      if (data.availability.length > 0) {
        await tx.insert(assetAvailability).values(
          data.availability.map(s => ({
            assetId: data.assetId,
            dayOfWeek: s.dayOfWeek,
            openTime: s.openTime,
            closeTime: s.closeTime,
          }))
        );
      }

      // 2. Closures - convert ISO dates and interpret as Asia/Jakarta local midnight
      await tx.delete(assetClosures).where(eq(assetClosures.assetId, data.assetId));
      if (data.closures.length > 0) {
        await tx.insert(assetClosures).values(
          data.closures.map(c => {
            // Local date interpretation
            const localDate = toDate(c.date, { timeZone: "Asia/Jakarta" });
            return {
              assetId: data.assetId,
              date: localDate,
            };
          })
        );
      }

      // Audit Log
      await tx.insert(auditLogs).values({
        actorId: context.user.id,
        actorType: "user",
        action: "asset.schedules_update",
        entityType: "asset",
        entityId: data.assetId,
        metadata: {
          availabilityCount: data.availability.length,
          closuresCount: data.closures.length,
        },
      });
    });

    return { success: true };
  });

// --- Component ---

export const Route = createFileRoute("/admin/assets")({
  component: AdminAssetsComponent,
});

type Asset = {
  id: string;
  name: string;
  type: string;
  location?: string | null;
  capacity: number;
  status: string;
  createdAt: string | Date;
};

function AdminAssetsComponent() {
  const { user: currentUser } = Route.useRouteContext();
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State (Add / Edit)
  const [showForm, setShowForm] = useState(false);
  const [formId, setFormId] = useState<string | undefined>(undefined);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("room");
  const [formLocation, setFormLocation] = useState("");
  const [formCapacity, setFormCapacity] = useState(1);
  const [formStatus, setFormStatus] = useState("active");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleAsset, setScheduleAsset] = useState<Asset | null>(null);
  const [availList, setAvailList] = useState<Array<{ dayOfWeek: number; openTime: string; closeTime: string }>>([]);
  const [closuresList, setClosuresList] = useState<Array<{ date: string }>>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // New slot entry state
  const [newDay, setNewDay] = useState(1);
  const [newOpen, setNewOpen] = useState("08:00");
  const [newClose, setNewClose] = useState("16:00");

  // New closure entry state
  const [newClosureDate, setNewClosureDate] = useState("");

  // Archive Confirm Modal State
  const [archiveTarget, setArchiveTarget] = useState<Asset | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAssets = () => {
    setLoading(true);
    setError(null);
    getAssetsListFn()
      .then((data) => setAssetsList(data as any))
      .catch(() => setError("Failed to load assets."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenCreate = () => {
    setFormId(undefined);
    setFormName("");
    setFormType("room");
    setFormLocation("");
    setFormCapacity(1);
    setFormStatus("active");
    setFormError(null);
    setShowForm(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setFormId(asset.id);
    setFormName(asset.name);
    setFormType(asset.type);
    setFormLocation(asset.location || "");
    setFormCapacity(asset.capacity);
    setFormStatus(asset.status);
    setFormError(null);
    setShowForm(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formCapacity <= 0) {
      setFormError("Asset name and positive capacity are required.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      await saveAssetFn({
        id: formId,
        name: formName,
        type: formType,
        location: formLocation,
        capacity: formCapacity,
        status: formStatus,
      });
      setShowForm(false);
      fetchAssets();
    } catch (err: any) {
      setFormError(err.message || "Failed to save asset.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenArchive = (asset: Asset) => {
    setArchiveTarget(asset);
    setShowArchiveConfirm(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setFormLoading(true);
    try {
      await archiveAssetFn({ data: archiveTarget.id });
      setShowArchiveConfirm(false);
      setArchiveTarget(null);
      fetchAssets();
    } catch (err: any) {
      alert("Failed to archive asset.");
    } finally {
      setFormLoading(false);
    }
  };

  // Availability Schedule Modals
  const handleOpenSchedules = async (asset: Asset) => {
    setScheduleAsset(asset);
    setAvailList([]);
    setClosuresList([]);
    setScheduleError(null);
    setShowScheduleModal(true);
    setScheduleLoading(true);

    try {
      const data = await getAssetSchedulesFn({ data: asset.id });
      setAvailList(data.availability.map(s => ({
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime,
        closeTime: s.closeTime,
      })));
      setClosuresList(data.closures.map(c => ({
        // Show as standard ISO date string local formatting
        date: formatInTimeZone(new Date(c.date), "Asia/Jakarta", "yyyy-MM-dd"),
      })));
    } catch (err) {
      setScheduleError("Failed to load asset schedules.");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleAddAvailability = () => {
    if (newOpen >= newClose) {
      alert("Close time must be after open time.");
      return;
    }
    setAvailList((prev) => [...prev, { dayOfWeek: newDay, openTime: newOpen, closeTime: newClose }]);
  };

  const handleRemoveAvailability = (index: number) => {
    setAvailList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddClosure = () => {
    if (!newClosureDate) return;
    if (closuresList.some(c => c.date === newClosureDate)) return;
    setClosuresList((prev) => [...prev, { date: newClosureDate }]);
  };

  const handleRemoveClosure = (index: number) => {
    setClosuresList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedules = async () => {
    if (!scheduleAsset) return;
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      await saveAssetSchedulesFn({
        assetId: scheduleAsset.id,
        availability: availList,
        closures: closuresList,
      });
      setShowScheduleModal(false);
    } catch (err: any) {
      setScheduleError(err.message || "Failed to save schedules.");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Pagination details
  const totalItems = assetsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedAssets = assetsList.slice(startIndex, endIndex);

  const daysLabel = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-sm font-medium text-[#71717a] animate-pulse">Loading assets...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#09090b]">Asset Management</h2>
          <p className="text-xs text-[#71717a]">Manage rooms, dormitories, operating schedules, and closures</p>
        </div>
        {currentUser.role !== "pimpinan" && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3 py-2 bg-[#09090b] text-white hover:bg-[#27272a] rounded-md text-xs font-semibold shadow-sm outline-none transition-colors"
          >
            <Plus size={16} />
            <span>Add Asset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-sm rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchAssets} className="ml-auto underline font-medium">Retry</button>
        </div>
      )}

      {/* Assets Table */}
      <div className="border border-[#e4e4e7] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e4e4e7] text-xs font-semibold text-[#71717a]">
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Location</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7] text-sm">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center flex flex-col gap-2 justify-center items-center">
                    <h3 className="font-semibold text-lg text-[#09090b]">No assets found</h3>
                    <p className="text-xs text-[#71717a]">Add a room or dormitory to start managing availability and bookings.</p>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#fafafa]">
                    <td className="p-4 font-medium text-[#09090b]">{asset.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-[#e4e4e7] text-[#09090b] text-[10px] font-semibold uppercase rounded">
                        {asset.type}
                      </span>
                    </td>
                    <td className="p-4 text-[#71717a]">{asset.location || "N/A"}</td>
                    <td className="p-4 text-[#09090b]">{asset.capacity} pax</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                          asset.status === "active"
                            ? "bg-[#ecfdf5] text-[#059669]"
                            : asset.status === "inactive"
                            ? "bg-[#fffbeb] text-[#d97706]"
                            : "bg-[#fef2f2] text-[#e11d48]"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      {currentUser.role !== "pimpinan" && asset.status !== "archived" && (
                        <>
                          <button
                            onClick={() => handleOpenSchedules(asset)}
                            title="Manage Availability & Closures"
                            className="p-2 text-[#71717a] hover:text-[#09090b] hover:bg-[#e4e4e7] rounded-md transition-colors"
                          >
                            <Calendar size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            title="Edit Asset"
                            className="p-2 text-[#71717a] hover:text-[#09090b] hover:bg-[#e4e4e7] rounded-md transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenArchive(asset)}
                            title="Archive Asset"
                            className="p-2 text-[#71717a] hover:text-[#e11d48] hover:bg-[#fef2f2] rounded-md transition-colors"
                          >
                            <Archive size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#e4e4e7] flex items-center justify-between text-xs text-[#71717a] bg-[#fafafa]">
          <span>
            Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} assets
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

      {/* Asset Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveAsset}
            className="w-full max-w-[450px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-3">
              <h3 className="text-base font-bold text-[#09090b]">{formId ? "Edit Asset" : "Add Asset"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-[#71717a] hover:text-[#09090b]">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-md">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="assetName" className="text-xs font-medium text-[#71717a]">
                Asset Name
              </label>
              <input
                id="assetName"
                type="text"
                disabled={formLoading}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
                placeholder="e.g. Ruang Rapat Garuda"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="assetType" className="text-xs font-medium text-[#71717a]">
                Asset Type
              </label>
              <select
                id="assetType"
                disabled={formLoading}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
              >
                <option value="room">Room</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="assetLocation" className="text-xs font-medium text-[#71717a]">
                Location
              </label>
              <input
                id="assetLocation"
                type="text"
                disabled={formLoading}
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
                placeholder="e.g. Gedung Utama Lantai 2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="assetCapacity" className="text-xs font-medium text-[#71717a]">
                Capacity (pax)
              </label>
              <input
                id="assetCapacity"
                type="number"
                disabled={formLoading}
                value={formCapacity}
                onChange={(e) => setFormCapacity(Number(e.target.value))}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
                min={1}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="assetStatus" className="text-xs font-medium text-[#71717a]">
                Status
              </label>
              <select
                id="assetStatus"
                disabled={formLoading}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="px-3 py-2 border border-[#e4e4e7] rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end border-t border-[#e4e4e7] pt-3 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-[#e4e4e7] bg-white text-xs font-medium rounded-md hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-3 py-1.5 bg-[#09090b] text-white text-xs font-medium rounded-md hover:bg-[#27272a] disabled:opacity-50"
              >
                {formLoading ? "Saving..." : "Save Asset"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Availability & Closures Modal */}
      {showScheduleModal && scheduleAsset && (
        <div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[600px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-3">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[#09090b]">Configure Schedules</h3>
                <p className="text-xs text-[#71717a]">{scheduleAsset.name}</p>
              </div>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="text-[#71717a] hover:text-[#09090b]">
                <X size={18} />
              </button>
            </div>

            {scheduleError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#e11d48] text-xs rounded-md">
                {scheduleError}
              </div>
            )}

            {/* Weekly Availability Sections */}
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold text-xs text-[#09090b] flex items-center gap-2">
                <Clock size={16} />
                <span>Weekly Availability Schedule (WIB)</span>
              </h4>

              {/* Add availability form */}
              <div className="grid grid-cols-4 gap-2 items-end p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-[#71717a]">Day</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    className="px-2 py-1 border border-[#e4e4e7] rounded text-xs bg-white"
                  >
                    {daysLabel.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-[#71717a]">Open Time</label>
                  <input
                    type="time"
                    value={newOpen}
                    onChange={(e) => setNewOpen(e.target.value)}
                    className="px-2 py-1 border border-[#e4e4e7] rounded text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-[#71717a]">Close Time</label>
                  <input
                    type="time"
                    value={newClose}
                    onChange={(e) => setNewClose(e.target.value)}
                    className="px-2 py-1 border border-[#e4e4e7] rounded text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAvailability}
                  className="px-3 py-1.5 bg-[#09090b] text-white hover:bg-[#27272a] rounded text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {/* Schedule list */}
              <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-[#e4e4e7] rounded-lg divide-y divide-[#e4e4e7]">
                {availList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#71717a]">No weekly availability defined.</div>
                ) : (
                  availList.map((slot, index) => (
                    <div key={index} className="flex justify-between items-center p-2.5 text-xs">
                      <span className="font-medium">{daysLabel[slot.dayOfWeek]}</span>
                      <span className="text-[#71717a]">{slot.openTime} - {slot.closeTime} WIB</span>
                      <button
                        onClick={() => handleRemoveAvailability(index)}
                        className="text-[#e11d48] hover:bg-[#fef2f2] p-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Date-specific Closures Section */}
            <div className="flex flex-col gap-3 border-t border-[#e4e4e7] pt-4">
              <h4 className="font-semibold text-xs text-[#09090b] flex items-center gap-2">
                <Calendar size={16} />
                <span>Date-Specific Closures (Holiday/Maintenance)</span>
              </h4>

              {/* Add closure form */}
              <div className="grid grid-cols-4 gap-2 items-end p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
                <div className="col-span-3 flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-[#71717a]">Closure Date</label>
                  <input
                    type="date"
                    value={newClosureDate}
                    onChange={(e) => setNewClosureDate(e.target.value)}
                    className="px-2 py-1.5 border border-[#e4e4e7] rounded text-xs bg-white outline-none w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddClosure}
                  className="px-3 py-1.5 bg-[#09090b] text-white hover:bg-[#27272a] rounded text-xs font-semibold h-[32px] flex items-center justify-center"
                >
                  Add
                </button>
              </div>

              {/* Closures list */}
              <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-[#e4e4e7] rounded-lg divide-y divide-[#e4e4e7]">
                {closuresList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#71717a]">No custom closures scheduled.</div>
                ) : (
                  closuresList.map((closure, index) => (
                    <div key={index} className="flex justify-between items-center p-2.5 text-xs">
                      <span>{closure.date}</span>
                      <button
                        onClick={() => handleRemoveClosure(index)}
                        className="text-[#e11d48] hover:bg-[#fef2f2] p-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-[#e4e4e7] pt-3 mt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                disabled={scheduleLoading}
                className="px-3 py-1.5 border border-[#e4e4e7] bg-white text-xs font-medium rounded-md hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedules}
                disabled={scheduleLoading}
                className="px-3 py-1.5 bg-[#09090b] text-white text-xs font-medium rounded-md hover:bg-[#27272a] disabled:opacity-50"
              >
                {scheduleLoading ? "Saving..." : "Save Schedules"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && archiveTarget && (
        <div className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[450px] bg-white border border-[#e4e4e7] rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-[#09090b]">Archive Asset</h3>
              <p className="text-xs text-[#71717a]">
                Archive Asset: Are you sure you want to archive this asset? The asset will no longer be available for future bookings, but all historical booking records and audit logs will be permanently retained.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowArchiveConfirm(false);
                  setArchiveTarget(null);
                }}
                disabled={formLoading}
                className="px-3 py-1.5 border border-[#e4e4e7] bg-white hover:bg-[#fafafa] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={formLoading}
                className="px-3 py-1.5 bg-[#e11d48] text-white hover:bg-[#be123c] text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {formLoading ? "Archiving..." : "Archive Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
