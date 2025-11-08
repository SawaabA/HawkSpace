import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useRooms } from "@/hooks/useRooms";
import { useRoomCalendar } from "@/hooks/useRoomCalendar";
import { useAuth } from "@/context/AuthContext";
import { createBookingRequest } from "@/services/bookings";
import {
  formatDateWithWeekday,
  getDefaultDate,
  slotOptions,
  slotToTime,
  slotsConflict,
} from "@/utils/slots";
import { MAX_BOOKING_HOURS, MAX_SLOTS_PER_BOOKING, OPERATING_TIMEZONE, TOTAL_SLOTS } from "@/constants/schedule";

const statusColors = {
  available: "#ecfccb",
  pending: "#fef3c7",
  modified: "#e0e7ff",
  approved: "#fee2e2",
};

export default function RequestBooking() {
  const { rooms } = useRooms({ activeOnly: true });
  const { user, profile } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialRoom = params.get("roomId");
  const initialDate = params.get("date") || getDefaultDate();
  const initialStart = params.get("startSlot") ? Number(params.get("startSlot")) : null;
  const initialEnd = initialStart != null ? Math.min(initialStart + 2, TOTAL_SLOTS) : null;

  const [roomId, setRoomId] = useState(initialRoom || "");
  const [date, setDate] = useState(initialDate);
  const [startSlot, setStartSlot] = useState(initialStart);
  const [endSlot, setEndSlot] = useState(initialEnd);
  const [notes, setNotes] = useState(params.get("notes") || "");
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId && rooms.length) setRoomId(rooms[0].id);
  }, [rooms, roomId]);

  const selectedRoom = rooms.find((room) => room.id === roomId);
  const { calendar } = useRoomCalendar(roomId, date);

  const slotChoices = slotOptions();
  const startOptions = slotChoices.filter((opt) => opt.slot < TOTAL_SLOTS);
  const endOptions = slotChoices.filter((opt) => opt.slot > (startSlot ?? -1) && opt.slot <= Math.min(TOTAL_SLOTS, (startSlot ?? 0) + MAX_SLOTS_PER_BOOKING));

  const conflict = useMemo(() => {
    if (startSlot == null || endSlot == null) return false;
    return slotsConflict(calendar?.slots, startSlot, endSlot);
  }, [calendar, startSlot, endSlot]);

  const timelineSlots = useMemo(() => {
    const slots = calendar?.slots || {};
    return Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
      const entry = slots?.[slot];
      const status = entry?.status || "available";
      const isSelected = startSlot != null && endSlot != null && slot >= startSlot && slot < endSlot;
      return { slot, status, label: slotToTime(slot), isSelected };
    });
  }, [calendar, startSlot, endSlot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { replace: true, state: { from: location } });
      return;
    }
    if (!selectedRoom) {
      setError("Select a room");
      return;
    }
    if (startSlot == null || endSlot == null) {
      setError("Select a start and end time");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const id = await createBookingRequest({
        room: selectedRoom,
        date,
        startSlot,
        endSlot,
        notes,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: profile?.displayName || user.email,
          role: profile?.role,
        },
      });
      setSuccessId(id);
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div>
        <h1>Request submitted ✅</h1>
        <p>Tracking ID: <code>{successId}</code></p>
        <p>You&apos;ll receive an email when an admin reviews the request.</p>
        <button onClick={() => navigate("/my-requests")}>View my requests</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Request a Classroom</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>Maximum duration {MAX_BOOKING_HOURS} hours ({OPERATING_TIMEZONE}).</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.2rem", maxWidth: 720 }}>
        <label style={labelStyle}>
          Room
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={inputStyle} required>
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.displayName || room.name || room.id} ({room.building})
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} required />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <label style={labelStyle}>
            Start time
            <select
              value={startSlot ?? ""}
              onChange={(e) => {
                const slot = Number(e.target.value);
                setStartSlot(slot);
                if (!endSlot || endSlot <= slot) {
                  setEndSlot(Math.min(slot + 2, TOTAL_SLOTS));
                }
              }}
              style={inputStyle}
              required
            >
              <option value="">Select…</option>
              {startOptions.map((opt) => (
                <option key={opt.slot} value={opt.slot}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            End time
            <select
              value={endSlot ?? ""}
              onChange={(e) => setEndSlot(Number(e.target.value))}
              style={inputStyle}
              required
              disabled={startSlot == null}
            >
              <option value="">Select…</option>
              {endOptions.map((opt) => (
                <option key={opt.slot} value={opt.slot}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Club name, setup needs, etc."
          />
        </label>

        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        {conflict && <div style={{ color: "#92400e" }}>Selected time overlaps an approved or pending request.</div>}

        <button
          type="submit"
          disabled={submitting || conflict}
          style={{
            padding: "0.9rem 1.4rem",
            borderRadius: 12,
            border: "none",
            background: conflict ? "#cbd5f5" : "#4338ca",
            color: "white",
            fontWeight: 600,
            cursor: conflict ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <section style={{ marginTop: "2rem" }}>
        <h2>
          Timeline — {selectedRoom ? selectedRoom.displayName || selectedRoom.name : "Pick a room"}
        </h2>
        <p style={{ color: "#6b7280", marginTop: -8 }}>{formatDateWithWeekday(date)}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.entries(statusColors).map(([status, color]) => (
            <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 12, textTransform: "capitalize" }}>{status}</span>
            </span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6 }}>
          {timelineSlots.map((slot) => (
            <div
              key={slot.slot}
              style={{
                padding: ".45rem .4rem",
                borderRadius: 10,
                border: slot.isSelected ? "2px solid #4338ca" : "1px solid #e5e7eb",
                background: statusColors[slot.status] || "#ecfccb",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {slot.label}
              <br />
              <strong>{slot.status}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const labelStyle = { display: "grid", gap: 6, fontSize: 14, color: "#111827" };
const inputStyle = {
  width: "100%",
  padding: ".6rem .75rem",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  fontSize: 16,
  background: "#fff",
};
