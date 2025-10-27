// src/pages/RequestBooking.jsx
import { useState } from "react";

export default function RequestBooking() {
  const [formData, setFormData] = useState({
    name: "", email: "", club: "", room: "",
    date: "", startTime: "", endTime: "", notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.room ||
        !formData.date || !formData.startTime || !formData.endTime) {
      alert("Please fill out all required fields."); return;
    }
    if (formData.endTime <= formData.startTime) {
      alert("End time must be later than start time."); return;
    }
    console.log("Booking stored in DB:", formData);
    console.log("Auto-email sent to:", formData.email);
    console.log("Admin notified.");
    setSubmitted(true);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Room Booking Request (Prototype)</h1>

      {!submitted ? (
        <form onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem", width: 320 }}>
          <input name="name" placeholder="Your Name" onChange={handleChange} />
          <input name="email" placeholder="Your Email" onChange={handleChange} />
          <input name="club" placeholder="Club Name" onChange={handleChange} />
          <input name="room" placeholder="Room Requested" onChange={handleChange} />
          <input type="date" name="date" onChange={handleChange} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div>
              <label style={{ fontSize: 14 }}>Start Time</label>
              <input type="time" name="startTime" onChange={handleChange} />
            </div>
            <div>
              <label style={{ fontSize: 14 }}>End Time</label>
              <input type="time" name="endTime" onChange={handleChange} />
            </div>
          </div>
          <textarea name="notes" placeholder="Additional Notes" onChange={handleChange} />
          <button type="submit"
            style={{ background: "#3b82f6", color: "#fff", padding: "0.6rem",
                     border: "none", borderRadius: 6, cursor: "pointer" }}>
            Submit Booking
          </button>
        </form>
      ) : (
        <div style={{ marginTop: "2rem" }}>
          <h3>Booking Submitted!</h3>
          <p>
            A confirmation email has been sent to <strong>{formData.email}</strong>.<br />
            Admin has been notified for approval.
          </p>
          <pre style={{ background: "#f3f3f3", padding: "1rem", borderRadius: 6 }}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
