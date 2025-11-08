import { useBookingRequests } from "@/hooks/useBookingRequests";
import { useAuth } from "@/context/AuthContext";
import { describeSlotRange, formatDateWithWeekday } from "@/utils/slots";

const statusPalette = {
  pending: { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#dcfce7", color: "#166534" },
  modified: { bg: "#e0e7ff", color: "#312e81" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  cancelled: { bg: "#f1f5f9", color: "#475467" },
};

export default function MyRequests() {
  const { user } = useAuth();
  const { requests, loading } = useBookingRequests({ requestedBy: user?.uid });

  if (!user) return <p>Please sign in to view your requests.</p>;

  return (
    <div>
      <h1>My Requests</h1>
      <p style={{ color: "#64748b", marginTop: -6 }}>Cancellations will be available in a future update.</p>

      {loading && <p>Loading…</p>}
      {!loading && requests.length === 0 && <p>No requests yet.</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {requests.map((req) => (
          <article
            key={req.id}
            style={{
              padding: "1rem",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              background: "white",
              boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
            }}
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
    </div>
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
