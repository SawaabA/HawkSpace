import {
  arrayUnion,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore"
import { db } from "@/services/firebase"
import {
  buildSlotRange,
  computeDurationLabel,
  describeSlotRange,
  slotToTime,
  slotsConflict,
  validateSlotWindow,
} from "@/utils/slots"
import { OPERATING_TIMEZONE } from "@/constants/schedule"

const bookingRequestsCol = collection(db, "bookingRequests")

const randomId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID()
  return `hist-${Math.random().toString(36).slice(2, 10)}`
}

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
  timestamp: new Date().toISOString(),
})

const applySlots = (slots = {}, startSlot, endSlot, requestId, status) => {
  const next = { ...(slots || {}) }
  for (const slot of buildSlotRange(startSlot, endSlot)) {
    next[slot] = { status, requestId }
  }
  return next
}

const removeSlots = (slots = {}, startSlot, endSlot, requestId) => {
  const next = { ...(slots || {}) }
  for (const slot of buildSlotRange(startSlot, endSlot)) {
    if (next[slot]?.requestId === requestId) delete next[slot]
  }
  return next
}

const ensureCalendar = (snap, roomId, date) => {
  if (snap.exists()) return snap.data()
  return { roomId, date, slots: {}, pendingRequestIds: [] }
}

export async function createBookingRequest({
  room,
  date,
  startSlot,
  endSlot,
  notes = "",
  user,
}) {
  if (!room?.id) throw new Error("Select a room to continue")
  validateSlotWindow({ date, startSlot, endSlot })

  const requestRef = doc(bookingRequestsCol)
  const calendarRef = doc(db, "rooms", room.id, "days", date)

  await runTransaction(db, async (tx) => {
    const calendarSnap = await tx.get(calendarRef)
    const calendarData = ensureCalendar(calendarSnap, room.id, date)

    if (slotsConflict(calendarData.slots, startSlot, endSlot)) {
      throw new Error("That time window is already claimed or pending review.")
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
      history: [
        buildHistoryEntry("created", user, notes || "Submitted request"),
      ],
    }

    tx.set(requestRef, requestDoc)

    const slots = applySlots(
      calendarData.slots,
      startSlot,
      endSlot,
      requestRef.id,
      "pending"
    )
    const pending = new Set(calendarData.pendingRequestIds || [])
    pending.add(requestRef.id)

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
    )
  })

  return requestRef.id
}

export async function approveBookingRequest({
  requestId,
  admin,
  adminNotes = "",
}) {
  const requestRef = doc(db, "bookingRequests", requestId)
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef)
    if (!requestSnap.exists()) throw new Error("Request not found")
    const request = requestSnap.data()

    const calendarRef = doc(db, "rooms", request.roomId, "days", request.date)
    const calendarSnap = await tx.get(calendarRef)
    const calendarData = ensureCalendar(
      calendarSnap,
      request.roomId,
      request.date
    )

    if (
      slotsConflict(
        calendarData.slots,
        request.startSlot,
        request.endSlot,
        requestId
      )
    ) {
      throw new Error(
        "Conflict detected while approving. Try a different time."
      )
    }

    const slots = applySlots(
      calendarData.slots,
      request.startSlot,
      request.endSlot,
      requestId,
      "approved"
    )
    const pending = new Set(calendarData.pendingRequestIds || [])
    pending.delete(requestId)

    tx.update(requestRef, {
      status: "approved",
      adminNotes: adminNotes || request.adminNotes || "",
      decision: `Approved for ${describeSlotRange(
        request.startSlot,
        request.endSlot
      )}`,
      updatedAt: serverTimestamp(),
      history: arrayUnion(buildHistoryEntry("approved", admin, adminNotes)),
    })

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
    )
  })
}

export async function rejectBookingRequest({ requestId, admin, reason = "" }) {
  const requestRef = doc(db, "bookingRequests", requestId)
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef)
    if (!requestSnap.exists()) throw new Error("Request not found")
    const request = requestSnap.data()

    const calendarRef = doc(db, "rooms", request.roomId, "days", request.date)
    const calendarSnap = await tx.get(calendarRef)
    const calendarData = ensureCalendar(
      calendarSnap,
      request.roomId,
      request.date
    )

    const slots = removeSlots(
      calendarData.slots,
      request.startSlot,
      request.endSlot,
      requestId
    )
    const pending = new Set(calendarData.pendingRequestIds || [])
    pending.delete(requestId)

    tx.update(requestRef, {
      status: "rejected",
      adminNotes: reason,
      decision: reason || "Rejected",
      updatedAt: serverTimestamp(),
      history: arrayUnion(buildHistoryEntry("rejected", admin, reason)),
    })

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
    )
  })
}

export async function createRecurringBookingRequests({
  room,
  startDate,
  startSlot,
  endSlot,
  notes = "",
  user,
  recurrenceType,
  recurrenceCount,
}) {
  if (!room?.id) throw new Error("Select a room to continue")
  if (!recurrenceType || !recurrenceCount) {
    throw new Error("Invalid recurrence settings")
  }

  const seriesId = `series-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const requestIds = []

  for (let i = 0; i < recurrenceCount; i++) {
    const occurrenceDate = new Date(startDate)
    
    if (recurrenceType === "weekly") {
      occurrenceDate.setDate(occurrenceDate.getDate() + (i * 7))
    } else if (recurrenceType === "monthly") {
      occurrenceDate.setMonth(occurrenceDate.getMonth() + i)
    }

    const dateStr = occurrenceDate.toISOString().split("T")[0]
    
    try {
      validateSlotWindow({ date: dateStr, startSlot, endSlot })

      const requestRef = doc(bookingRequestsCol)
      const calendarRef = doc(db, "rooms", room.id, "days", dateStr)

      await runTransaction(db, async (tx) => {
        const calendarSnap = await tx.get(calendarRef)
        const calendarData = ensureCalendar(calendarSnap, room.id, dateStr)

        if (slotsConflict(calendarData.slots, startSlot, endSlot)) {
          throw new Error(`Conflict on ${dateStr} - slot already taken`)
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
          date: dateStr,
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
          seriesId,
          seriesInfo: {
            type: recurrenceType,
            count: recurrenceCount,
            index: i,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          history: [
            buildHistoryEntry(
              "created",
              user,
              `${notes || "Recurring booking"} (${i + 1}/${recurrenceCount})`
            ),
          ],
        }

        tx.set(requestRef, requestDoc)

        const slots = applySlots(
          calendarData.slots,
          startSlot,
          endSlot,
          requestRef.id,
          "pending"
        )
        const pending = new Set(calendarData.pendingRequestIds || [])
        pending.add(requestRef.id)

        tx.set(
          calendarRef,
          {
            roomId: room.id,
            date: dateStr,
            slots,
            pendingRequestIds: Array.from(pending),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      })

      requestIds.push(requestRef.id)
    } catch (err) {
      // If any occurrence fails, we still continue with others
      console.warn(`Skipped occurrence ${i + 1} on ${dateStr}:`, err.message)
    }
  }

  if (requestIds.length === 0) {
    throw new Error("Could not create any bookings in the series")
  }

  return { seriesId, requestIds }
}

export async function cancelRecurringSeries({ seriesId, user }) {
  if (!seriesId) throw new Error("Series ID required")

  // Query all requests in this series
  const requestsQuery = query(
    collection(db, "bookingRequests"),
    where("seriesId", "==", seriesId)
  )
  
  const snapshot = await getDocs(requestsQuery)
  
  if (snapshot.empty) {
    throw new Error("No bookings found in this series")
  }

  const cancellations = []
  
  for (const docSnap of snapshot.docs) {
    const request = docSnap.data()
    
    // Only cancel pending, modified, or approved bookings
    if (["pending", "modified", "approved"].includes(request.status)) {
      const requestRef = doc(db, "bookingRequests", docSnap.id)
      const calendarRef = doc(db, "rooms", request.roomId, "days", request.date)
      
      try {
        await runTransaction(db, async (tx) => {
          const calendarSnap = await tx.get(calendarRef)
          const calendarData = ensureCalendar(calendarSnap, request.roomId, request.date)
          
          const slots = removeSlots(
            calendarData.slots,
            request.startSlot,
            request.endSlot,
            docSnap.id
          )
          const pending = new Set(calendarData.pendingRequestIds || [])
          pending.delete(docSnap.id)
          
          tx.update(requestRef, {
            status: "cancelled",
            decision: "Cancelled by user",
            updatedAt: serverTimestamp(),
            history: arrayUnion(buildHistoryEntry("cancelled", user, "Cancelled series")),
          })
          
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
          )
        })
        
        cancellations.push(docSnap.id)
      } catch (err) {
        console.warn(`Failed to cancel booking ${docSnap.id}:`, err.message)
      }
    }
  }
  
  if (cancellations.length === 0) {
    throw new Error("No bookings were cancelled (they may already be cancelled or rejected)")
  }
  
  return { cancelled: cancellations }
}

export async function overrideBookingRequest({
  requestId,
  admin,
  reason,
  priorityLevel = "high",
}) {
  if (!requestId) throw new Error("Request ID required")
  if (!reason) throw new Error("Override reason required")

  const requestRef = doc(db, "bookingRequests", requestId)
  
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef)
    if (!requestSnap.exists()) throw new Error("Request not found")
    const request = requestSnap.data()

    const calendarRef = doc(db, "rooms", request.roomId, "days", request.date)
    const calendarSnap = await tx.get(calendarRef)
    const calendarData = ensureCalendar(calendarSnap, request.roomId, request.date)

    // Find and cancel any conflicting approved bookings
    const conflictingRequestIds = new Set()
    for (const slot of buildSlotRange(request.startSlot, request.endSlot)) {
      const slotData = calendarData.slots?.[slot]
      if (slotData && slotData.status === "approved" && slotData.requestId !== requestId) {
        conflictingRequestIds.add(slotData.requestId)
      }
    }

    // Override conflicting bookings
    for (const conflictId of conflictingRequestIds) {
      const conflictRef = doc(db, "bookingRequests", conflictId)
      const conflictSnap = await tx.get(conflictRef)
      
      if (conflictSnap.exists()) {
        const conflictData = conflictSnap.data()
        
        // Remove conflicting booking slots
        for (const slot of buildSlotRange(conflictData.startSlot, conflictData.endSlot)) {
          if (calendarData.slots?.[slot]?.requestId === conflictId) {
            delete calendarData.slots[slot]
          }
        }
        
        // Mark conflicting booking as overridden
        tx.update(conflictRef, {
          status: "overridden",
          decision: `Overridden by admin for priority event: ${reason}`,
          updatedAt: serverTimestamp(),
          history: arrayUnion(
            buildHistoryEntry("overridden", admin, `Overridden for: ${reason}`, {
              overriddenBy: requestId,
              priorityLevel,
            })
          ),
        })
      }
    }

    // Apply slots for the new priority booking
    const slots = applySlots(
      calendarData.slots,
      request.startSlot,
      request.endSlot,
      requestId,
      "approved"
    )
    
    const pending = new Set(calendarData.pendingRequestIds || [])
    pending.delete(requestId)

    // Update the priority request to approved
    tx.update(requestRef, {
      status: "approved",
      adminNotes: reason,
      decision: `Approved with override (${priorityLevel} priority)`,
      updatedAt: serverTimestamp(),
      history: arrayUnion(
        buildHistoryEntry("approved_override", admin, reason, {
          overrode: Array.from(conflictingRequestIds),
          priorityLevel,
        })
      ),
    })

    // Update calendar
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
    )
  })

  return { success: true }
}

export async function modifyBookingRequest({ requestId, admin, updates }) {
  const requestRef = doc(db, "bookingRequests", requestId)
  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef)
    if (!requestSnap.exists()) throw new Error("Request not found")
    const request = requestSnap.data()

    const newDate = updates.date || request.date
    const newStart =
      typeof updates.startSlot === "number"
        ? updates.startSlot
        : request.startSlot
    const newEnd =
      typeof updates.endSlot === "number" ? updates.endSlot : request.endSlot
    validateSlotWindow({ date: newDate, startSlot: newStart, endSlot: newEnd })

    const currentCalendarRef = doc(
      db,
      "rooms",
      request.roomId,
      "days",
      request.date
    )
    const currentCalendarSnap = await tx.get(currentCalendarRef)
    const currentCalendar = ensureCalendar(
      currentCalendarSnap,
      request.roomId,
      request.date
    )

    const cleanedSlots = removeSlots(
      currentCalendar.slots,
      request.startSlot,
      request.endSlot,
      requestId
    )
    const currentPending = new Set(currentCalendar.pendingRequestIds || [])
    currentPending.delete(requestId)

    const targetCalendarRef =
      newDate === request.date
        ? currentCalendarRef
        : doc(db, "rooms", request.roomId, "days", newDate)
    const targetCalendarSnap =
      newDate === request.date
        ? currentCalendarSnap
        : await tx.get(targetCalendarRef)
    const targetCalendar =
      newDate === request.date
        ? {
            ...currentCalendar,
            slots: cleanedSlots,
            pendingRequestIds: Array.from(currentPending),
          }
        : ensureCalendar(targetCalendarSnap, request.roomId, newDate)

    if (slotsConflict(targetCalendar.slots, newStart, newEnd, requestId)) {
      throw new Error("That updated time overlaps another booking.")
    }

    const slots = applySlots(
      targetCalendar.slots,
      newStart,
      newEnd,
      requestId,
      "pending"
    )
    const pending = new Set(targetCalendar.pendingRequestIds || [])
    pending.add(requestId)

    const historyMeta = {
      from: {
        date: request.date,
        startSlot: request.startSlot,
        endSlot: request.endSlot,
      },
      to: { date: newDate, startSlot: newStart, endSlot: newEnd },
    }

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
        buildHistoryEntry(
          "modified",
          admin,
          updates.reason || "Updated time",
          historyMeta
        )
      ),
    })

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
    )

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
      )
    }
  })
}
