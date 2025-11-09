import {
  CLOSE_TIME,
  MAX_SLOTS_PER_BOOKING,
  OPEN_TIME,
  OPERATING_DAYS,
  OPERATING_TIMEZONE,
  SLOT_INTERVAL_MINUTES,
  TOTAL_SLOTS,
} from "@/constants/schedule";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayFormatter = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  timeZone: OPERATING_TIMEZONE,
});
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: OPERATING_TIMEZONE,
});

const openMinutes = timeStringToMinutes(OPEN_TIME);

export function timeStringToMinutes(value) {
  if (!value) return 0;
  const [h, m] = value.split(":").map((v) => Number(v));
  return h * 60 + m;
}

export function minutesToTimeString(totalMinutes) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(normalized % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function slotToTime(slotIndex) {
  if (slotIndex === TOTAL_SLOTS) return CLOSE_TIME;
  return minutesToTimeString(openMinutes + slotIndex * SLOT_INTERVAL_MINUTES);
}

export function timeToSlot(timeString) {
  const minutes = timeStringToMinutes(timeString);
  const slot = Math.floor((minutes - openMinutes) / SLOT_INTERVAL_MINUTES);
  return Math.max(0, Math.min(TOTAL_SLOTS, slot));
}

export function buildSlotRange(startSlot, endSlot) {
  return Array.from({ length: Math.max(0, endSlot - startSlot) }, (_, idx) => startSlot + idx);
}

export function slotsConflict(slots = {}, startSlot, endSlot, ignoreRequestId) {
  return buildSlotRange(startSlot, endSlot).some((slot) => {
    const entry = slots?.[slot];
    if (!entry) return false;
    if (ignoreRequestId && entry.requestId === ignoreRequestId) return false;
    return entry.status === "approved" || entry.status === "pending" || entry.status === "modified";
  });
}

export function isOperatingDay(dateString, allowedDays = OPERATING_DAYS) {
  const dayIndex = getWeekdayIndex(dateString);
  return allowedDays.includes(dayIndex);
}

export function getWeekdayIndex(dateString) {
  if (!dateString) return -1;
  const safeDate = new Date(`${dateString}T00:00:00Z`);
  const label = weekdayFormatter.format(safeDate);
  return WEEKDAY_LABELS.indexOf(label);
}

export function describeSlotRange(startSlot, endSlot) {
  return `${slotToTime(startSlot)}–${slotToTime(endSlot)}`;
}

export function validateSlotWindow({ date, startSlot, endSlot }) {
  if (!date) throw new Error("Please select a date");
  if (!isOperatingDay(date)) throw new Error("Bookings are limited to Monday through Friday");
  if (typeof startSlot !== "number" || typeof endSlot !== "number") {
    throw new Error("Choose start and end times");
  }
  if (!(startSlot < endSlot)) throw new Error("End time must be after start time");
  if (startSlot < 0 || endSlot > TOTAL_SLOTS) throw new Error("Selected time falls outside operating hours");
  if (endSlot - startSlot > MAX_SLOTS_PER_BOOKING) {
    const maxHours = (MAX_SLOTS_PER_BOOKING * SLOT_INTERVAL_MINUTES) / 60;
    throw new Error(`Bookings can be up to ${maxHours} hours (max ${MAX_SLOTS_PER_BOOKING} slots).`);
  }
}

export function formatDateWithWeekday(dateString) {
  if (!dateString) return "";
  return dateFormatter.format(new Date(`${dateString}T00:00:00Z`));
}

export function slotOptions() {
  return Array.from({ length: TOTAL_SLOTS + 1 }, (_, slot) => ({
    slot,
    label: slotToTime(slot),
  }));
}

export function getDefaultDate(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const iso = now.toISOString().slice(0, 10);
  if (isOperatingDay(iso)) return iso;
  return getDefaultDate(offsetDays + 1);
}

export function computeDurationLabel(startSlot, endSlot) {
  const slots = endSlot - startSlot;
  const minutes = slots * SLOT_INTERVAL_MINUTES;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!minutes) return "0m";
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}
