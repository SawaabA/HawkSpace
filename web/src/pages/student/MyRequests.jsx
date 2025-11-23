import { useBookingRequests } from "@/hooks/useBookingRequests";
import { useAuth } from "@/context/AuthContext";
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
  const { requests, loading } = useBookingRequests({ requestedBy: user?.uid });

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
      <p style={{ color: "#64748b", marginTop: -6 }}>Cancellations will be available in a future update.</p>

      {loading && <p>Loading…</p>}
      {!loading && requests.length === 0 && <p>No requests yet.</p>}

      <div className="requests-stack">
        {requests.map((req) => (
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
              <Detail label="Decision" value={req.decision || "Pending"} />
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
  return (
    <span
      style={{
        padding: ".35rem .75rem",
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 13,
        textTransform: "capitalize",
        background: palette.bg,
        color: palette.color,
      }}
    >
      {status}
    </span>
  );
}
