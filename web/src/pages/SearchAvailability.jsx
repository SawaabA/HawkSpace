import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// import { seedRooms } from "../utils/seedRooms"; // run once if you need demo data

const EQUIPMENT_OPTIONS = ["projector", "whiteboard", "mic", "speakers", "hdmi"];
const BUILDINGS = ["Science", "Lazaridis Hall", "Peters"];

export default function SearchAvailability() {
  const [capacity, setCapacity] = useState("");
  const [building, setBuilding] = useState("");
  const [requiredEquip, setRequiredEquip] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const toggleEquip = (eq) =>
    setRequiredEquip((prev) =>
      prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]
    );

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const col = collection(db, "rooms");
      const cap = Number(capacity || 0);

      let q = null;
      if (cap > 0 && building) {
        q = query(col, where("active", "==", true), where("capacity", ">=", cap), where("building", "==", building));
      } else if (cap > 0) {
        q = query(col, where("active", "==", true), where("capacity", ">=", cap));
      } else if (building) {
        q = query(col, where("active", "==", true), where("building", "==", building));
      } else {
        q = query(col, where("active", "==", true));
      }

      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const filtered =
        requiredEquip.length === 0
          ? all
          : all.filter(
              (r) =>
                Array.isArray(r.equipment) &&
                requiredEquip.every((e) => r.equipment.includes(e))
            );

      setRooms(all);
      setResults(filtered);
    } catch (e) {
      console.error(e);
      alert("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // seedRooms(); // <- uncomment & refresh ONCE if you need demo data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-search whenever filters change
  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity, building, requiredEquip.join("|")]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>Search Availability</h1>
      <p>Rooms are available 24/7 (time conflicts off for Sprint-1).</p>

      <div style={{ display: "grid", gap: "1rem", maxWidth: 720, gridTemplateColumns: "1fr 1fr" }}>
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
          <label>Building</label>
          <select value={building} onChange={(e) => setBuilding(e.target.value)}>
            <option value="">Any</option>
            {BUILDINGS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
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
      </div>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Results</h2>
      {loading ? (
        <p>Loading…</p>
      ) : results.length === 0 ? (
        <p>No rooms match your filters.</p>
      ) : (
        <ul style={{ display: "grid", gap: ".75rem", paddingLeft: 0, listStyle: "none" }}>
          {results.map((r) => (
            <li key={r.id}
                style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem", background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{r.building} – {r.name}</h3>
                  <div>Capacity: {r.capacity ?? "—"}</div>
                  <div>Equipment: {Array.isArray(r.equipment) ? r.equipment.join(", ") : "—"}</div>
                </div>
                <button
                  style={{ alignSelf: "center", background: "#3b82f6", color: "white",
                           border: "none", padding: ".5rem .9rem", borderRadius: 8, cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/request-booking?roomId=${r.id}`, { state: { room: r } })
                  }
                >
                  Request Booking
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
