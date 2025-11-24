import { useState } from "react";
import { useBookingRequests } from "@/hooks/useBookingRequests";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { describeSlotRange, formatDateWithWeekday } from "@/utils/slots";
import { cancelRecurringSeries } from "@/services/bookings";

const statusPalette = {
  pending: { bg: "#fff1cc", color: "#8b6500" },
  approved: { bg: "#e2f8ec", color: "#0f683b" },
  modified: { bg: "#ede7ff", color: "#382a73" },
  rejected: { bg: "#ffe2e2", color: "#8a1f1f" },
  cancelled: { bg: "#f5f3ff", color: "#5f5a7f" },
};

export default function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requests, loading } = useBookingRequests({ requestedBy: user?.uid });
  const [cancellingSeriesId, setCancellingSeriesId] = useState(null);

  const statusLabels = {
    pending: "Pending review",
    approved: "Approved",
    modified: "Updated · pending review",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  const statusOrder = {
    pending: 0,
    modified: 1,
    approved: 2,
    rejected: 3,
    cancelled: 4,
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 99;
    const orderB = statusOrder[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    if (a.date === b.date) return (a.startSlot ?? 0) - (b.startSlot ?? 0);
    return (a.date || "").localeCompare(b.date || "");
  });

  // Group by series
  const seriesMap = new Map();
  const singleRequests = [];

  sortedRequests.forEach((req) => {
    if (req.seriesId) {
      if (!seriesMap.has(req.seriesId)) {
        seriesMap.set(req.seriesId, []);
      }
      seriesMap.get(req.seriesId).push(req);
    } else {
      singleRequests.push(req);
    }
  });

  const pendingCount = requests.filter((req) => req.status === "pending" || req.status === "modified").length;

  const handleCancelSeries = async (seriesId) => {
    if (!confirm("Cancel all bookings in this recurring series?")) return;
    
    setCancellingSeriesId(seriesId);
    try {
      await cancelRecurringSeries({ seriesId, user });
      alert("Series cancelled successfully");
    } catch (err) {
      alert(err.message || "Failed to cancel series");
    } finally {
      setCancellingSeriesId(null);
    }
  };

  if (!user) {
    return (
      <section className="student-section">
        <p>Please sign in to view your requests.</p>
      </section>
    );
  }

  return (
    <section className="student-section">
      <div className="chip">My Requests</div>
      <h2>Requests you&apos;ve submitted</h2>
      <p style={{ color: "#64748b", marginTop: -6 }}>
        {pendingCount > 0
          ? `You have ${pendingCount} request${pendingCount > 1 ? "s" : ""} awaiting review. Cancellations will be available in a future update.`
          : "Cancellations will be available in a future update."}
      </p>

      {loading && <p style={{ color: "#64748b" }}>Loading your latest requests…</p>}
      {!loading && requests.length === 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <p style={{ color: "#64748b" }}>You haven&apos;t submitted any room requests yet.</p>
          <button type="button" className="primary-btn" onClick={() => navigate("/request")}>
            Submit your first request
          </button>
        </div>
      )}

      <div className="requests-stack">
        {Array.from(seriesMap.entries()).map(([seriesId, seriesRequests]) => {
          const firstReq = seriesRequests[0];
          const allCancelled = seriesRequests.every((r) => r.status === "cancelled" || r.status === "rejected");
          
          return (
            <article
              key={seriesId}
              className="request-card"
              style={{ border: "2px solid #c4b5fd", background: "#faf8ff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🔁</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Recurring Series: {firstReq.roomName}</div>
                    <div style={{ fontSize: 13, color: "#6b5a90" }}>
                      {seriesRequests.length} bookings · {firstReq.seriesInfo?.type}
                    </div>
                  </div>
                </div>
                {!allCancelled && (
                  <button
                    onClick={() => handleCancelSeries(seriesId)}
                    disabled={cancellingSeriesId === seriesId}
                    style={{
                      padding: ".4rem .9rem",
                      borderRadius: 8,
                      border: "1px solid #dc2626",
                      background: "white",
                      color: "#dc2626",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {cancellingSeriesId === seriesId ? "Cancelling..." : "Cancel Series"}
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gap: 8, marginLeft: 28 }}>
                {seriesRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: ".75rem",
                      borderRadius: 10,
                      background: "white",
                      border: "1px solid #e9e3ff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{formatDateWithWeekday(req.date)}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>
                          {describeSlotRange(req.startSlot, req.endSlot)}
                        </div>
                      </div>
                      <StatusPill status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}

        {singleRequests.map((req) => (
          <article
            key={req.id}
            className="request-card"
          >
            <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{req.roomName}</div>
                <div style={{ color: "#475467", fontSize: 14 }}>{formatDateWithWeekday(req.date)}</div>
              </div>
              <StatusPill status={req.status} />
            </header>

            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginTop: 12,
                marginBottom: 12,
              }}
            >
              <Detail label="Time" value={describeSlotRange(req.startSlot, req.endSlot)} />
              <Detail label="Submitted on" value={req.createdAt?.toDate?.().toLocaleString?.() || "—"} />
              <Detail label="Status" value={statusLabels[req.status] || "Pending review"} />
              {req.decision && <Detail label="Decision" value={req.decision} />}
            </dl>

            {req.notes && (
              <div style={{ fontSize: 14, color: "#334155" }}>
                <strong>Your notes:</strong> {req.notes}
              </div>
            )}
            {req.adminNotes && (
              <div style={{ fontSize: 14, color: "#0f172a", marginTop: 8 }}>
                <strong>Admin notes:</strong> {req.adminNotes}
              </div>
            )}
            {req.status === "pending" && (
              <p style={{ fontSize: 13, color: "#854d0e", marginTop: 8 }}>
                This request is waiting for admin review. You&apos;ll receive an email once a decision is made.
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "#94a3b8" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const palette = statusPalette[status] || statusPalette.pending;
  const labelMap = {
    pending: "Pending",
    approved: "Approved",
    modified: "Modified",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };
  const label = labelMap[status] || "Pending";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 96,
        padding: ".3rem .9rem",
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.08,
        background: palette.bg,
        color: palette.color,
      }}
    >
      {label}
    </span>
  );
}
