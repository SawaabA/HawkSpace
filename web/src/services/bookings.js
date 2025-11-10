import {
  arrayUnion,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  buildSlotRange,
  computeDurationLabel,
  describeSlotRange,
  slotToTime,
  slotsConflict,
  validateSlotWindow,
} from "@/utils/slots";
import { OPERATING_TIMEZONE } from "@/constants/schedule";

const bookingRequestsCol = collection(db, "bookingRequests");

const randomId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `hist-${Math.random().toString(36).slice(2, 10)}`;
};

const buildHistoryEntry = (action, actor, notes = "", meta = {}) => ({
  id: randomId(),
  action,
  actor: {
    uid: actor?.uid || "system",
    email: actor?.email || "system",
    displayName: actor?.displayName || actor?.email || "System",
    role: actor?.role || null,
  },
  notes,
  meta,
  timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp() for arrays
});

const applySlots = (slots = {}, startSlot, endSlot, requestId, status) => {
  const next = { ...(slots || {}) };
  for (const slot of buildSlotRange(startSlot, endSlot)) {
    next[slot] = { status, requestId };
  }
  return next;
};

const removeSlots = (slots = {}, startSlot, endSlot, requestId) => {
  const next = { ...(slots || {}) };
  for (const slot of buildSlotRange(startSlot, endSlot)) {
    if (next[slot]?.requestId === requestId) delete next[slot];
  }
  return next;
};

const ensureCalendar = (snap, roomId, date) => {
  if (snap.exists()) return snap.data();
  return { roomId, date, slots: {}, pendingRequestIds: [] };
};

export async function createBookingRequest({ room, date, startSlot, endSlot, notes = "", user }) {
  if (!room?.id) throw new Error("Select a room to continue");
  validateSlotWindow({ date, startSlot, endSlot });

  const requestRef = doc(bookingRequestsCol);
  const calendarRef = doc(db, "rooms", room.id, "days", date);

  await runTransaction(db, async (tx) => {
    const calendarSnap = await tx.get(calendarRef);
    const calendarData = ensureCalendar(calendarSnap, room.id, date);

    if (slotsConflict(calendarData.slots, startSlot, endSlot)) {
      throw new Error("That time window is already claimed or pending review.");
    }

    const requestDoc = {
      id: requestRef.id,
      roomId: room.id,
      roomName: room.displayName || room.name || room.id,
      roomSnapshot: {
        displayName: room.displayName || room.name || room.id,
        building: room.building || "",
        floor: room.floor || "",
        capacity: room.capacity || null,
        equipment: room.equipment || [],
      },
      requestedBy: {
        uid: user?.uid || "",
        email: user?.email || "",
        displayName: user?.displayName || user?.email || "",
      },
      date,
      startSlot,
      endSlot,
      startTime: slotToTime(startSlot),
      endTime: slotToTime(endSlot),
      durationLabel: computeDurationLabel(startSlot, endSlot),
      status: "pending",
      notes,
      adminNotes: "",
      decision: "",
      timezone: OPERATING_TIMEZONE,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [buildHistoryEntry("created", user, notes || "Submitted request")],
    };

    tx.set(requestRef, requestDoc);

    const slots = applySlots(calendarData.slots, startSlot, endSlot, requestRef.id, "pending");
    const pending = new Set(calendarData.pendingRequestIds || []);
    pending.add(requestRef.id);

    tx.set(
      calendarRef,
      {
        roomId: room.id,
        date,
        slots,
        pendingRequestIds: Array.from(pending),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  return requestRef.id;
}

export async function approveBookingRequest({ requestId, admin, adminNotes = "" }) {
  const requestRef = doc(db, "bookingRequests", requestId);
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists()) throw new Error("Request not found");
    const request = requestSnap.data();

    const calendarRef = doc(db, "rooms", request.roomId, "days", request.date);
    const calendarSnap = await tx.get(calendarRef);
    const calendarData = ensureCalendar(calendarSnap, request.roomId, request.date);

    if (slotsConflict(calendarData.slots, request.startSlot, request.endSlot, requestId)) {
      throw new Error("Conflict detected while approving. Try a different time.");
    }

    const slots = applySlots(calendarData.slots, request.startSlot, request.endSlot, requestId, "approved");
    const pending = new Set(calendarData.pendingRequestIds || []);
    pending.delete(requestId);

    tx.update(requestRef, {
      status: "approved",
      adminNotes: adminNotes || request.adminNotes || "",
      decision: `Approved for ${describeSlotRange(request.startSlot, request.endSlot)}`,
      updatedAt: serverTimestamp(),
      history: arrayUnion(buildHistoryEntry("approved", admin, adminNotes)),
    });

    tx.set(
      calendarRef,
      {
        roomId: request.roomId,
        date: request.date,
        slots,
        pendingRequestIds: Array.from(pending),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function rejectBookingRequest({ requestId, admin, reason = "" }) {
  const requestRef = doc(db, "bookingRequests", requestId);
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists()) throw new Error("Request not found");
    const request = requestSnap.data();

    const calendarRef = doc(db, "rooms", request.roomId, "days", request.date);
    const calendarSnap = await tx.get(calendarRef);
    const calendarData = ensureCalendar(calendarSnap, request.roomId, request.date);

    const slots = removeSlots(calendarData.slots, request.startSlot, request.endSlot, requestId);
    const pending = new Set(calendarData.pendingRequestIds || []);
    pending.delete(requestId);

    tx.update(requestRef, {
      status: "rejected",
      adminNotes: reason,
      decision: reason || "Rejected",
      updatedAt: serverTimestamp(),
      history: arrayUnion(buildHistoryEntry("rejected", admin, reason)),
    });

    tx.set(
      calendarRef,
      {
        roomId: request.roomId,
        date: request.date,
        slots,
        pendingRequestIds: Array.from(pending),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function modifyBookingRequest({ requestId, admin, updates }) {
  const requestRef = doc(db, "bookingRequests", requestId);
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists()) throw new Error("Request not found");
    const request = requestSnap.data();

    const newDate = updates.date || request.date;
    const newStart = typeof updates.startSlot === "number" ? updates.startSlot : request.startSlot;
    const newEnd = typeof updates.endSlot === "number" ? updates.endSlot : request.endSlot;
    validateSlotWindow({ date: newDate, startSlot: newStart, endSlot: newEnd });

    const currentCalendarRef = doc(db, "rooms", request.roomId, "days", request.date);
    const currentCalendarSnap = await tx.get(currentCalendarRef);
    const currentCalendar = ensureCalendar(currentCalendarSnap, request.roomId, request.date);

    const cleanedSlots = removeSlots(currentCalendar.slots, request.startSlot, request.endSlot, requestId);
    const currentPending = new Set(currentCalendar.pendingRequestIds || []);
    currentPending.delete(requestId);

    const targetCalendarRef = newDate === request.date
      ? currentCalendarRef
      : doc(db, "rooms", request.roomId, "days", newDate);
    const targetCalendarSnap = newDate === request.date ? currentCalendarSnap : await tx.get(targetCalendarRef);
    const targetCalendar = newDate === request.date
      ? { ...currentCalendar, slots: cleanedSlots, pendingRequestIds: Array.from(currentPending) }
      : ensureCalendar(targetCalendarSnap, request.roomId, newDate);

    if (slotsConflict(targetCalendar.slots, newStart, newEnd, requestId)) {
      throw new Error("That updated time overlaps another booking.");
    }

    const slots = applySlots(targetCalendar.slots, newStart, newEnd, requestId, "pending");
    const pending = new Set(targetCalendar.pendingRequestIds || []);
    pending.add(requestId);

    const historyMeta = {
      from: {
        date: request.date,
        startSlot: request.startSlot,
        endSlot: request.endSlot,
      },
      to: { date: newDate, startSlot: newStart, endSlot: newEnd },
    };

    tx.update(requestRef, {
      date: newDate,
      startSlot: newStart,
      endSlot: newEnd,
      startTime: slotToTime(newStart),
      endTime: slotToTime(newEnd),
      durationLabel: computeDurationLabel(newStart, newEnd),
      status: "modified",
      decision: "Pending admin review",
      updatedAt: serverTimestamp(),
      history: arrayUnion(
        buildHistoryEntry("modified", admin, updates.reason || "Updated time", historyMeta)
      ),
    });

    tx.set(
      targetCalendarRef,
      {
        roomId: request.roomId,
        date: newDate,
        slots,
        pendingRequestIds: Array.from(pending),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (newDate !== request.date) {
      tx.set(
        currentCalendarRef,
        {
          roomId: request.roomId,
          date: request.date,
          slots: cleanedSlots,
          pendingRequestIds: Array.from(currentPending),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  });
}
