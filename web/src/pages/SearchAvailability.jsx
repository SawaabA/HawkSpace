import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection, getDocs, query, where,
} from "firebase/firestore";

const EQUIPMENT_OPTIONS = ["projector", "whiteboard", "mic", "speakers", "hdmi"];

export default function SearchAvailability() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [requiredEquip, setRequiredEquip] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [results, setResults] = useState([]);

  const validTimeWindow = useMemo(() => {
    if (!startTime || !endTime) return false;
    return endTime > startTime;
  }, [startTime, endTime]);

  const toggleEquip = (item) => {
    setRequiredEquip((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    if (!date || !startTime || !endTime) {
      alert("Pick date, start, and end time.");
      return;
    }
    if (!validTimeWindow) {
      alert("End time must be later than start time.");
      return;
    }

    setLoading(true);
    try {
      // 1) Get candidate rooms (capacity + active). We’ll filter equipment client-side.
      const roomsRef = collection(db, "rooms");
      const capNum = Number(capacity || 0);
      const qRooms =
        capNum > 0
          ? query(roomsRef, where("active", "==", true), where("capacity", ">=", capNum))
          : query(roomsRef, where("active", "==", true));

      const snap = await getDocs(qRooms);
      const candidates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2) Filter by required equipment on the client (all required must be present).
      const equipFiltered = requiredEquip.length
        ? candidates.filter((r) =>
            Array.isArray(r.equipment) &&
            requiredEquip.every((eq) => r.equipment.includes(eq))
          )
        : candidates;

      // 3) Load bookings for selected date and filter for overlap.
      // Overlap rule: (booking.start < endTime) && (booking.end > startTime)
      // We’ll pull all bookings for the date once, then filter by room.
      const bookingsRef = collection(db, "bookings");
      const qBookings = query(bookingsRef, where("date", "==", date));
      const bSnap = await getDocs(qBookings);
      const bookings = bSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const overlappingByRoom = new Map();
      for (const b of bookings) {
        const overlaps = b.startTime < endTime && b.endTime > startTime;
        if (overlaps) {
          const arr = overlappingByRoom.get(b.roomId) || [];
          arr.push(b);
          overlappingByRoom.set(b.roomId, arr);
        }
      }

      // 4) Available rooms = equipFiltered minus rooms with overlap.
      const available = equipFiltered.filter((r) => !overlappingByRoom.has(r.id));

      setRooms(equipFiltered);
      setResults(available);
    } catch (err) {
      console.error(err);
      alert("Search failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-run when all key fields are filled & valid
    if (date && startTime && endTime && validTimeWindow) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startTime, endTime, capacity, requiredEquip.join("|")]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>Search Availability</h1>
      <p>Filter by date, time, capacity, and equipment.</p>

      <form
        onSubmit={handleSearch}
        style={{ display: "grid", gap: "1rem", maxWidth: 700, gridTemplateColumns: "1fr 1fr" }}
      >
        <div>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label>Capacity (min)</label>
          <input
            type="number"
            min={0}
            placeholder="e.g., 20"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div>
          <label>Start Time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        <div>
          <label>End Time</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Equipment</label>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginTop: ".5rem" }}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <label key={eq} style={{ display: "inline-flex", gap: ".4rem", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={requiredEquip.includes(eq)}
                  onChange={() => toggleEquip(eq)}
                />
                {eq}
              </label>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#111827",
              color: "#fff",
              padding: ".7rem 1rem",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
          {!validTimeWindow && startTime && endTime && (
            <div style={{ color: "#b91c1c", marginTop: ".5rem" }}>
              End time must be after start time.
            </div>
          )}
        </div>
      </form>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Results</h2>
      {results.length === 0 ? (
        <p>No rooms match your criteria (or they’re booked).</p>
      ) : (
        <ul style={{ display: "grid", gap: ".75rem", paddingLeft: 0, listStyle: "none" }}>
          {results.map((r) => (
            <li
              key={r.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "1rem",
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{r.name || r.id}</h3>
                  <div>Capacity: {r.capacity ?? "—"}</div>
                  <div>Equipment: {Array.isArray(r.equipment) ? r.equipment.join(", ") : "—"}</div>
                </div>
                <button
                  style={{
                    alignSelf: "center",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    padding: ".5rem .9rem",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => alert(`Proceed to request booking for ${r.name || r.id}`)}
                >
                  Request Booking
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Optional: show how many rooms match equipment/capacity before time filter */}
      {rooms.length > results.length && (
        <p style={{ color: "#6b7280" }}>
          {rooms.length - results.length} room(s) filtered out due to time conflict.
        </p>
      )}
    </div>
  );
}
