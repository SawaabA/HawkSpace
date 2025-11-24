import { useBookingRequests } from "@/hooks/useBookingRequests";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { describeSlotRange, formatDateWithWeekday } from "@/utils/slots";

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

  const pendingCount = requests.filter((req) => req.status === "pending" || req.status === "modified").length;

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
        {sortedRequests.map((req) => (
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
