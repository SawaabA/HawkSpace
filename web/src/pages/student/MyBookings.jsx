import React from "react";
import { useBookings } from "../context/BookingContext";

export default function MyBookings() {
  const { bookings, cancelBooking } = useBookings();

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.8rem" }}>
          {bookings
            .slice()
            .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
            .map(b => (
            <li key={b.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem", background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.roomName}</div>
                  <div>{b.date} · {b.startTime}–{b.endTime}</div>
                  {b.notes && <div style={{ color: "#6b7280" }}>{b.notes}</div>}
                </div>
                <button
                  onClick={() => cancelBooking(b.id)}
                  style={{ alignSelf: "center", background: "#ffffff", border: "1px solid #e5e7eb", padding: ".5rem .8rem", borderRadius: 8, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
