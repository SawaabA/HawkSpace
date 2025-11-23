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
  available: "#f4f0ff",
  pending: "#fff1cc",
  modified: "#dfe7ff",
  approved: "#e2f8ec",
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
  const urlEndSlot = params.get("endSlot");
  const initialEnd =
    urlEndSlot != null
      ? Number(urlEndSlot)
      : initialStart != null
        ? Math.min(initialStart + 2, TOTAL_SLOTS)
        : null;

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
      <section className="student-section">
        <div className="chip">Request submitted</div>
        <h2>We&apos;ve received your booking</h2>
        <p>Tracking ID: <code>{successId}</code></p>
        <p>You&apos;ll receive an email when an admin reviews the request.</p>
        <button type="button" className="primary-btn" onClick={() => navigate("/my-requests")}>
          View my requests
        </button>
      </section>
    );
  }

  return (
    <section className="student-section">
      <header style={{ marginBottom: "1.5rem" }}>
        <div className="chip">Request a space</div>
        <h2>Request a Classroom</h2>
        <p style={{ color: "#6d6785", margin: 0 }}>
          Maximum duration {MAX_BOOKING_HOURS} hours ({OPERATING_TIMEZONE}). Tell us what you need and we&apos;ll do the rest.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.2rem", maxWidth: 720 }}>
        <label className="filter-field">
          Room
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="filter-input" required>
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.displayName || room.name || room.id} ({room.building})
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="filter-input" required />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <label className="filter-field">
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
              className="filter-input"
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

          <label className="filter-field">
            End time
            <select
              value={endSlot ?? ""}
              onChange={(e) => setEndSlot(Number(e.target.value))}
              className="filter-input"
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

        <label className="filter-field">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="filter-input"
            style={{ resize: "vertical" }}
            placeholder="Club name, setup needs, etc."
          />
        </label>

        {error && <div style={{ color: "#b91c1c", fontWeight: 600 }}>{error}</div>}
        {conflict && <div style={{ color: "#92400e", fontWeight: 600 }}>Selected time overlaps an approved or pending request.</div>}

        <button
          type="submit"
          disabled={submitting || conflict}
          className="primary-btn"
          style={{
            opacity: submitting || conflict ? 0.7 : 1,
            cursor: submitting || conflict ? "not-allowed" : "pointer",
            width: "fit-content",
          }}
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <section className="timeline-panel" style={{ marginTop: "2rem" }}>
        <h3>
          Timeline — {selectedRoom ? selectedRoom.displayName || selectedRoom.name : "Pick a room"}
        </h3>
        <p style={{ color: "#6b7280", marginTop: -8 }}>{formatDateWithWeekday(date)}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.entries(statusColors).map(([status, color]) => (
            <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 12, textTransform: "capitalize" }}>{status}</span>
            </span>
          ))}
        </div>
        <div className="timeline-grid">
          {timelineSlots.map((slot) => (
            <div
              key={slot.slot}
              className="timeline-cell"
              style={{
                background: slot.isSelected ? "#ffd86f" : statusColors[slot.status] || "#f4f0ff",
                border: slot.isSelected ? "2px solid #3b1764" : undefined,
                color: slot.isSelected ? "#3b1764" : undefined,
              }}
            >
              {slot.label}
              <br />
              <strong>{slot.status}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
