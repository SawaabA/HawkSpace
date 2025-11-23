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
  available: "#f4f0ff",
  pending: "#fff1cc",
  modified: "#dfe7ff",
  approved: "#e2f8ec",
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
    <section className="student-section">
      <header style={{ marginBottom: "1.5rem" }}>
        <div className="chip">Search Available Rooms</div>
        <h2 style={{ marginBottom: 8 }}>Search Laurier rooms</h2>
        <p style={{ color: "#5f5976", margin: 0 }}>
          Monday–Friday, 08:30–23:00 ({OPERATING_TIMEZONE}). Pending requests show in gold so you know what&apos;s queued.
        </p>
      </header>

      <div className="filter-grid">
        <label className="filter-field">
          Building
          <select value={building} onChange={(e) => setBuilding(e.target.value)} className="filter-input">
            <option value="">Any</option>
            {[...new Set(rooms.map((room) => room.building))].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          Min capacity
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="e.g. 20"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </label>

        <label className="filter-field">
          Date
          <input
            className="filter-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div>
        <span style={{ fontWeight: 600, color: "#38244f" }}>Equipment</span>
        <div className="equipment-pills" style={{ marginTop: ".4rem" }}>
          {equipmentOptions.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggleEquip(eq)}
              className={requiredEquip.includes(eq) ? "equipment-pill active" : "equipment-pill"}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      <section style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "1.75rem" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div className="chip">Matching rooms ({filteredRooms.length})</div>
          {loading && <p style={{ color: "#6d6785" }}>Loading rooms…</p>}
          {!loading && filteredRooms.length === 0 && <p>No rooms match those filters.</p>}
          <div className="room-grid">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={room.id === selectedRoomId ? "room-card active" : "room-card"}
              >
                <div style={{ fontWeight: 600 }}>{room.displayName || room.name || room.id}</div>
                <div style={{ color: "#6b6787", fontSize: 14 }}>{room.building}</div>
                <div style={{ fontSize: 14, color: "#504567" }}>
                  Capacity {room.capacity || "—"} · {(room.equipment || []).join(", ") || "No equipment listed"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="timeline-panel">
          <header style={{ marginBottom: "0.5rem" }}>
            <h3 style={{ marginBottom: 0 }}>
              Timeline — {selectedRoom ? selectedRoom.displayName || selectedRoom.name : "Select a room"}
            </h3>
            <p style={{ color: "#6d6785", marginTop: 4 }}>{formatDateWithWeekday(date)}</p>
          </header>
          {selectedRoom ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 16, height: 16, background: color, borderRadius: 4 }} />
                    <span style={{ textTransform: "capitalize" }}>{status}</span>
                  </div>
                ))}
              </div>

              <div className="timeline-grid">
                {timelineSlots.map((slot) => (
                  <div
                    key={slot.slot}
                    className="timeline-cell"
                    style={{
                      background: statusColors[slot.status] || "#f4f0ff",
                    }}
                  >
                    {slot.label}
                    <br />
                    <span style={{ fontWeight: 600 }}>{slot.status}</span>
                  </div>
                ))}
              </div>

              <button type="button" onClick={startRequest} className="primary-btn" style={{ marginTop: "1.5rem" }}>
                Request this room
              </button>
            </>
          ) : (
            <p>Select a room to view availability.</p>
          )}
        </div>
      </section>
    </section>
  );
}
