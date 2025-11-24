// src/services/reports.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

const bookingRequestsCol = collection(db, "bookingRequests");

function monthRange(year, month1to12) {
  const m = String(month1to12).padStart(2, "0");
  const start = `${year}-${m}-01`;

  let nextYear = year;
  let nextMonth = month1to12 + 1;
  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear += 1;
  }

  const nm = String(nextMonth).padStart(2, "0");
  const end = `${nextYear}-${nm}-01`;

  return { start, end };
}

export async function getMonthlyUsageReport({ year, month, roomId = "all" }) {
  const { start, end } = monthRange(year, month);

  // Use a simple equality filter on status to avoid requiring a composite index.
  // We then filter the date range client-side for this small dataset.
  let q = query(bookingRequestsCol, where("status", "==", "approved"));

  if (roomId !== "all") {
    q = query(q, where("roomId", "==", roomId));
  }

  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const bookings = all.filter((b) => b.date >= start && b.date < end);

  // --- per-room aggregation ---
  const perRoomMap = new Map();

  for (const b of bookings) {
    const rid = b.roomId || "unknown";
    const rname =
      b.roomSnapshot?.displayName ||
      b.roomName ||
      "Unknown room";

    if (!perRoomMap.has(rid)) {
      perRoomMap.set(rid, {
        roomId: rid,
        roomName: rname,
        bookings: 0,
        students: new Set(),
      });
    }

    const entry = perRoomMap.get(rid);
    entry.bookings += 1;

    const uid = b.requestedBy?.uid;
    if (uid) entry.students.add(uid);
  }

  const perRoom = Array.from(perRoomMap.values()).map((r) => ({
    roomId: r.roomId,
    roomName: r.roomName,
    bookings: r.bookings,
    uniqueStudents: r.students.size,
  }));

  perRoom.sort((a, b) => b.bookings - a.bookings);

  const uniqueStudentsSet = new Set(
    bookings.map((b) => b.requestedBy?.uid).filter(Boolean)
  );

  return {
    year,
    month,
    totalBookings: bookings.length,
    uniqueStudents: uniqueStudentsSet.size,
    perRoom,
    rawBookings: bookings, // needed for detailed CSV export
  };
}
