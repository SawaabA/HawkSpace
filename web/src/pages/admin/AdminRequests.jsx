import { useEffect, useMemo, useState } from "react";
import { useBookingRequests } from "@/hooks/useBookingRequests";
import { useRoomCalendar } from "@/hooks/useRoomCalendar";
import { useRooms } from "@/hooks/useRooms";
import { useAuth } from "@/context/AuthContext";
import {
  approveBookingRequest,
  modifyBookingRequest,
  rejectBookingRequest,
} from "@/services/bookings";
import {
  describeSlotRange,
  formatDateWithWeekday,
  getDefaultDate,
  slotOptions,
} from "@/utils/slots";
import { MAX_SLOTS_PER_BOOKING, TOTAL_SLOTS } from "@/constants/schedule";

const statusPalette = {
  pending: "#fef3c7",
  modified: "#e0e7ff",
};

export default function AdminRequests() {
  const [dateFilter, setDateFilter] = useState(getDefaultDate());
  const { requests, loading } = useBookingRequests({ status: ["pending", "modified"], date: dateFilter });
  const [selectedId, setSelectedId] = useState(null);
  const { rooms } = useRooms();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!selectedId && requests.length) setSelectedId(requests[0].id);
  }, [requests, selectedId]);

  const selectedRequest = requests.find((req) => req.id === selectedId) || requests[0];
  const { calendar } = useRoomCalendar(selectedRequest?.roomId, selectedRequest?.date);
  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRequest?.roomId),
    [rooms, selectedRequest?.roomId]
  );
  const slotChoices = slotOptions();

  const [adminNote, setAdminNote] = useState("");
  const [editDate, setEditDate] = useState(selectedRequest?.date || dateFilter);
  const [editStart, setEditStart] = useState(selectedRequest?.startSlot ?? null);
  const [editEnd, setEditEnd] = useState(selectedRequest?.endSlot ?? null);
  const [actionStatus, setActionStatus] = useState("");

  useEffect(() => {
    if (!selectedRequest) return;
    setEditDate(selectedRequest.date);
    setEditStart(selectedRequest.startSlot);
    setEditEnd(selectedRequest.endSlot);
    setAdminNote("");
  }, [selectedRequest]);

  const actor = useMemo(
    () => ({
      uid: user?.uid,
      email: user?.email,
      displayName: profile?.displayName || user?.email,
      role: profile?.role,
    }),
    [user, profile]
  );

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionStatus("Approving…");
    try {
      await approveBookingRequest({ requestId: selectedRequest.id, admin: actor, adminNotes: adminNote });
      setAdminNote("");
      setActionStatus("Approved ✔");
    } catch (err) {
      setActionStatus(err.message || "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!adminNote) {
      setActionStatus("Add a reason before rejecting");
      return;
    }
    setActionStatus("Rejecting…");
    try {
      await rejectBookingRequest({ requestId: selectedRequest.id, admin: actor, reason: adminNote });
      setAdminNote("");
      setActionStatus("Rejected");
    } catch (err) {
      setActionStatus(err.message || "Failed to reject");
    }
  };

  const handleModify = async () => {
    if (!selectedRequest) return;
    if (editStart == null || editEnd == null) {
      setActionStatus("Choose start/end before modifying");
      return;
    }
    setActionStatus("Updating…");
    try {
      await modifyBookingRequest({
        requestId: selectedRequest.id,
        admin: actor,
        updates: {
          date: editDate,
          startSlot: editStart,
          endSlot: editEnd,
          reason: adminNote,
        },
      });
      setActionStatus("Updated");
    } catch (err) {
      setActionStatus(err.message || "Failed to modify");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h1>Pending Requests</h1>
        <label style={{ fontSize: 14 }}>
          Date filter
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && requests.length === 0 && <p>No pending requests for that day.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
        <section style={{ display: "grid", gap: 12 }}>
          {requests.map((req) => (
            <article
              key={req.id}
              onClick={() => setSelectedId(req.id)}
              style={{
                cursor: "pointer",
                padding: "0.9rem",
                borderRadius: 14,
                border: req.id === selectedRequest?.id ? "2px solid #4338ca" : "1px solid #e5e7eb",
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{req.roomName}</div>
                  <div style={{ fontSize: 13, color: "#475467" }}>{formatDateWithWeekday(req.date)}</div>
                </div>
                <span
                  style={{
                    padding: ".2rem .6rem",
                    borderRadius: 999,
                    background: statusPalette[req.status] || "#f1f5f9",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {req.status}
                </span>
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Requested by {req.requestedBy?.displayName || req.requestedBy?.email}</div>
              <div style={{ fontSize: 13, color: "#475467" }}>{describeSlotRange(req.startSlot, req.endSlot)}</div>
            </article>
          ))}
        </section>

        <section style={{ background: "white", borderRadius: 20, padding: "1.5rem", border: "1px solid #e5e7eb", minHeight: 400 }}>
          {selectedRequest ? (
            <div>
              <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedRequest.roomName}</h2>
                  <div style={{ color: "#475467" }}>{formatDateWithWeekday(selectedRequest.date)}</div>
                  <div style={{ fontSize: 14 }}>{describeSlotRange(selectedRequest.startSlot, selectedRequest.endSlot)}</div>
                  {activeRoom && (
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {activeRoom.building} · Capacity {activeRoom.capacity || "—"}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{selectedRequest.requestedBy?.displayName}</div>
                  <div>{selectedRequest.requestedBy?.email}</div>
                </div>
              </header>

              <div style={{ marginTop: 12, fontSize: 14 }}>
                {selectedRequest.notes ? (
                  <p>
                    <strong>Requester notes:</strong> {selectedRequest.notes}
                  </p>
                ) : (
                  <p style={{ color: "#94a3b8" }}>No additional notes.</p>
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Admin note</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  style={{ width: "100%", marginTop: 6, borderRadius: 10, border: "1px solid #cbd5f5", padding: "0.6rem" }}
                  placeholder="Decision notes or edits"
                />
              </div>

              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                <label style={{ fontSize: 13 }}>
                  Date
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label style={{ fontSize: 13 }}>
                  Start
                  <select value={editStart ?? ""} onChange={(e) => setEditStart(Number(e.target.value))}>
                    <option value="">—</option>
                    {slotChoices
                      .filter((opt) => opt.slot < TOTAL_SLOTS)
                      .map((opt) => (
                        <option key={opt.slot} value={opt.slot}>{opt.label}</option>
                      ))}
                  </select>
                </label>
                <label style={{ fontSize: 13 }}>
                  End
                  <select value={editEnd ?? ""} onChange={(e) => setEditEnd(Number(e.target.value))}>
                    <option value="">—</option>
                    {slotChoices
                      .filter(
                        (opt) =>
                          opt.slot > (editStart ?? -1) &&
                          opt.slot <= Math.min(TOTAL_SLOTS, (editStart ?? 0) + MAX_SLOTS_PER_BOOKING)
                      )
                      .map((opt) => (
                        <option key={opt.slot} value={opt.slot}>{opt.label}</option>
                      ))}
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={handleApprove} style={primaryButton}>Approve</button>
                <button onClick={handleModify} style={secondaryButton}>Modify window</button>
                <button onClick={handleReject} style={dangerButton}>Reject</button>
              </div>

              {actionStatus && <div style={{ marginTop: 10, color: "#374151" }}>{actionStatus}</div>}

              <AdminTimeline calendar={calendar} selectedRequest={selectedRequest} />
            </div>
          ) : (
            <p>Select a request to inspect it.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function AdminTimeline({ calendar, selectedRequest }) {
  const slots = calendar?.slots || {};
  const labels = slotOptions();
  const items = Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
    const entry = slots?.[slot];
    const status = entry?.status || "available";
    const isSelected =
      selectedRequest && slot >= selectedRequest.startSlot && slot < selectedRequest.endSlot;
    return { slot, status, isSelected, label: labels[slot]?.label };
  });
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 8, fontSize: 16 }}>Room calendar</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.slot}
            style={{
              padding: ".35rem",
              borderRadius: 8,
              border: item.isSelected ? "2px solid #4338ca" : "1px solid #e5e7eb",
              fontSize: 12,
              textAlign: "center",
              background:
                item.status === "approved"
                  ? "#fee2e2"
                  : item.status === "pending" || item.status === "modified"
                    ? "#fef3c7"
                    : "#ecfccb",
            }}
          >
            {item.label}
            <div style={{ fontWeight: 600 }}>{item.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const primaryButton = {
  padding: ".65rem 1.2rem",
  borderRadius: 10,
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryButton = {
  ...primaryButton,
  background: "#4338ca",
};
const dangerButton = {
  ...primaryButton,
  background: "#ef4444",
};
