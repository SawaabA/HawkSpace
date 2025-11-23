// src/pages/admin/AdminReports.jsx
import { useState, useMemo } from "react";
import { useRooms } from "@/hooks/useRooms";
import { getMonthlyUsageReport } from "@/services/reports";

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

// Detailed CSV Export (matches booking.js doc shape)
function exportDetailedCSV(report) {
  if (!report) return;

  const safe = (x) =>
    `"${String(x ?? "").replace(/"/g, '""')}"`;

  const header = [
    "Booking ID",
    "Student Name",
    "Student Email",
    "Student UID",
    "Room ID",
    "Room Name",
    "Room Display Name (Snapshot)",
    "Date",
    "Start Slot",
    "End Slot",
    "Start Time",
    "End Time",
    "Duration Label",
    "Student Notes",
    "Admin Notes",
    "Decision",
    "Status",
    "Timezone"
  ];

  const rows = (report.rawBookings || []).map((b) => {
    const studentName =
      b.requestedBy?.displayName ||
      b.requestedBy?.email ||
      "Unknown";

    const studentEmail = b.requestedBy?.email || "";
    const studentUID = b.requestedBy?.uid || "";

    const roomId = b.roomId || "";
    const roomName = b.roomName || "";
    const roomDisplayName = b.roomSnapshot?.displayName || "";

    const date = b.date || "";
    const startSlot = b.startSlot ?? "";
    const endSlot = b.endSlot ?? "";

    // Real times already saved in Firestore in booking.js
    const startTime = b.startTime || "";
    const endTime = b.endTime || "";

    const durationLabel = b.durationLabel || "";

    const notes = b.notes || "";
    const adminNotes = b.adminNotes || "";
    const decision = b.decision || "";

    const status = b.status || "";
    const timezone = b.timezone || "";

    return [
      b.id,
      safe(studentName),
      studentEmail,
      studentUID,
      roomId,
      safe(roomName),
      safe(roomDisplayName),
      date,
      startSlot,
      endSlot,
      safe(startTime),
      safe(endTime),
      safe(durationLabel),
      safe(notes),
      safe(adminNotes),
      safe(decision),
      status,
      timezone
    ];
  });

  const summaryRows = [
    ["REPORT MONTH", report.month],
    ["REPORT YEAR", report.year],
    ["TOTAL APPROVED BOOKINGS", report.totalBookings],
    ["UNIQUE STUDENTS", report.uniqueStudents],
    [], // blank line
  ];

  const csvString = [
    ...summaryRows.map((r) => r.join(",")),
    header.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `hawkspace-detailed-${report.year}-${String(report.month).padStart(2, "0")}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const { rooms } = useRooms();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [roomId, setRoomId] = useState("all");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const roomOptions = useMemo(
    () => [{ id: "all", name: "All rooms" }, ...(rooms || [])],
    [rooms]
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const data = await getMonthlyUsageReport({
        year: Number(year),
        month: Number(month),
        roomId,
      });
      setReport(data);
    } catch (e) {
      setError(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>Monthly Usage Report</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <label style={labelStyle}>
          Year
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Month
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={inputStyle}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Room
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={inputStyle}
          >
            {roomOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.roomName || r.id}
              </option>
            ))}
          </select>
        </label>

        <button onClick={handleGenerate} style={btn}>
          Generate
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {/* Report output */}
      {report && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ margin: 0 }}>
              {months[report.month - 1]} {report.year}
            </h2>

            <button onClick={() => exportDetailedCSV(report)} style={exportBtn}>
              Export Detailed CSV
            </button>
          </div>

          <p><b>Total approved bookings:</b> {report.totalBookings}</p>
          <p><b>Unique students:</b> {report.uniqueStudents}</p>

          <hr style={{ margin: "12px 0" }} />

          {report.perRoom.length === 0 ? (
            <p>No approved bookings for that month.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {report.perRoom.map((r) => (
                <div key={r.roomId} style={row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.roomName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{r.roomId}</div>
                  </div>
                  <div style={{ width: 120, textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{r.bookings}</div>
                    <div style={{ fontSize: 12 }}>bookings</div>
                  </div>
                  <div style={{ width: 140, textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{r.uniqueStudents}</div>
                    <div style={{ fontSize: 12 }}>students</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// styles
const labelStyle = { fontSize: 13, display: "grid", gap: 4 };
const inputStyle = {
  padding: ".45rem .6rem",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "white",
};

const btn = {
  padding: ".6rem 1rem",
  borderRadius: 8,
  border: "none",
  background: "#0ea5e9",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const exportBtn = {
  padding: ".5rem 1rem",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const card = {
  background: "white",
  borderRadius: 12,
  padding: "1rem",
  border: "1px solid #e5e7eb",
};

const row = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: ".75rem",
  borderRadius: 10,
  border: "1px solid #f1f5f9",
};
