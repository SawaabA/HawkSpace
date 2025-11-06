import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROOMS } from "../data/rooms";

const allBuildings = [...new Set(ROOMS.map(r => r.building))];

export default function BrowseRooms() {
  const [building, setBuilding] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [equipment, setEquipment] = useState("");

  const filtered = useMemo(() => {
    return ROOMS.filter(r => {
      if (building && r.building !== building) return false;
      if (minCapacity && r.capacity < Number(minCapacity)) return false;
      if (equipment && !r.equipment.includes(equipment)) return false;
      return true;
    });
  }, [building, minCapacity, equipment]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>Browse Rooms</h1>
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", maxWidth: 800 }}>
        <label>
          Building
          <select value={building} onChange={e => setBuilding(e.target.value)} style={{ width: "100%" }}>
            <option value="">All</option>
            {allBuildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        <label>
          Min Capacity
          <input type="number" value={minCapacity} onChange={e => setMinCapacity(e.target.value)} placeholder="e.g., 20" style={{ width: "100%" }} />
        </label>

        <label>
          Equipment
          <select value={equipment} onChange={e => setEquipment(e.target.value)} style={{ width: "100%" }}>
            <option value="">Any</option>
            <option value="projector">projector</option>
            <option value="whiteboard">whiteboard</option>
            <option value="speakers">speakers</option>
            <option value="hdmi">hdmi</option>
          </select>
        </label>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem", display: "grid", gap: "0.8rem" }}>
        {filtered.map(r => (
          <li key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem", background: "#fafafa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>{r.name} — {r.building}</h3>
                <div>Capacity: {r.capacity}</div>
                <div>Equipment: {r.equipment.join(", ")}</div>
              </div>
              <Link
                to={`/book/${r.id}`}
                style={{ alignSelf: "center", background: "#111827", color: "#fff", padding: ".6rem .9rem", borderRadius: 8, textDecoration: "none" }}
              >
                Book
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
