import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRooms } from "@/hooks/useRooms";
import { useRoomCalendar } from "@/hooks/useRoomCalendar";
import { OPERATING_TIMEZONE, TOTAL_SLOTS } from "@/constants/schedule";
import {
  formatDateWithWeekday,
  getDefaultDate,
  slotToTime,
} from "@/utils/slots";

const equipmentOptions = ["projector", "whiteboard", "speakers", "mic", "hdmi"];

const statusColors = {
  available: "#ecfccb",
  pending: "#fef3c7",
  modified: "#e0e7ff",
  approved: "#fee2e2",
};

export default function SearchAvailability() {
  const { rooms, loading } = useRooms({ activeOnly: true });
  const [building, setBuilding] = useState("");
  const [capacity, setCapacity] = useState("");
  const [requiredEquip, setRequiredEquip] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [date, setDate] = useState(getDefaultDate());
  const navigate = useNavigate();

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (building && room.building !== building) return false;
      if (capacity && Number(room.capacity || 0) < Number(capacity)) return false;
      if (requiredEquip.length) {
        const equipment = (room.equipment || []).map((item) => item.toLowerCase());
        if (!requiredEquip.every((req) => equipment.includes(req))) return false;
      }
      return true;
    });
  }, [rooms, building, capacity, requiredEquip]);

  useEffect(() => {
    if (!filteredRooms.length) {
      setSelectedRoomId(null);
      return;
    }
    if (!selectedRoomId || !filteredRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(filteredRooms[0].id);
    }
  }, [filteredRooms, selectedRoomId]);

  const selectedRoom = filteredRooms.find((room) => room.id === selectedRoomId);
  const { calendar } = useRoomCalendar(selectedRoomId, date);

  const timelineSlots = useMemo(() => {
    const slots = calendar?.slots || {};
    return Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
      const entry = slots?.[slot];
      return {
        slot,
        status: entry?.status || "available",
        label: slotToTime(slot),
      };
    });
  }, [calendar]);

  const toggleEquip = (value) => {
    setRequiredEquip((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const startRequest = () => {
    if (!selectedRoom) return;
    navigate(`/request?roomId=${selectedRoom.id}&date=${date}`);
  };

  return (
    <div>
      <h1>Find a Classroom</h1>
      <p style={{ color: "#475467", marginTop: -6 }}>
        Monday–Friday, 08:30–23:00 ({OPERATING_TIMEZONE}). Pending requests are shown as amber slots.
      </p>

      <section
        style={{
          marginTop: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <label style={labelStyle}>
          Building
          <select value={building} onChange={(e) => setBuilding(e.target.value)} style={inputStyle}>
            <option value="">Any</option>
            {[...new Set(rooms.map((room) => room.building))].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Min capacity
          <input
            style={inputStyle}
            type="number"
            min={0}
            placeholder="e.g. 20"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </label>

        <label style={labelStyle}>
          Date
          <input
            style={inputStyle}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </section>

      <div style={{ marginTop: "1rem" }}>
        <span style={{ fontWeight: 600 }}>Equipment</span>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".4rem" }}>
          {equipmentOptions.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggleEquip(eq)}
              style={{
                padding: ".35rem .75rem",
                borderRadius: "999px",
                border: requiredEquip.includes(eq) ? "1px solid #4338ca" : "1px solid #d1d5db",
                background: requiredEquip.includes(eq) ? "#eef2ff" : "white",
                textTransform: "capitalize",
                cursor: "pointer",
              }}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      <section style={{ marginTop: "2rem", display: "flex", gap: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h2>Matching rooms ({filteredRooms.length})</h2>
          {loading && <p>Loading rooms…</p>}
          {!loading && filteredRooms.length === 0 && <p>No rooms match those filters.</p>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.8rem" }}>
            {filteredRooms.map((room) => (
              <li
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                style={{
                  border: room.id === selectedRoomId ? "2px solid #4338ca" : "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: "1rem",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>{room.displayName || room.name || room.id}</div>
                <div style={{ color: "#6b7280", fontSize: 14 }}>{room.building}</div>
                <div style={{ fontSize: 14 }}>
                  Capacity {room.capacity || "—"} · {(room.equipment || []).join(", ") || "No equipment listed"}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1.2 }}>
          <h2>Timeline — {selectedRoom ? selectedRoom.displayName || selectedRoom.name : "Select a room"}</h2>
          <p style={{ color: "#6b7280", marginTop: -8 }}>{formatDateWithWeekday(date)}</p>
          {selectedRoom ? (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 16, height: 16, background: color, borderRadius: 4 }} />
                    <span style={{ textTransform: "capitalize", fontSize: 13 }}>{status}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                  gap: 6,
                }}
              >
                {timelineSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    style={{
                      padding: ".4rem",
                      borderRadius: 10,
                      background: statusColors[slot.status] || "#ecfccb",
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      textAlign: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    {slot.label}
                    <br />
                    <span style={{ fontWeight: 600 }}>{slot.status}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={startRequest}
                style={{
                  marginTop: "1.5rem",
                  background: "#4338ca",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: ".75rem 1.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Request this room
              </button>
            </div>
          ) : (
            <p>Select a room to view availability.</p>
          )}
        </div>
      </section>
    </div>
  );
}

const labelStyle = { display: "grid", gap: 6, fontSize: 14, color: "#1f2933" };
const inputStyle = {
  padding: ".5rem .75rem",
  borderRadius: 10,
  border: "1px solid #cbd5f5",
  fontSize: 16,
};
