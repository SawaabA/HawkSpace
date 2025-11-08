const toMinutes = (time) => {
  const [h, m] = time.split(":").map((v) => Number(v));
  return h * 60 + m;
};

export const OPERATING_DAYS = [1, 2, 3, 4, 5]; // Monday–Friday (0 = Sunday)
export const OPERATING_TIMEZONE = "America/Toronto";
export const OPEN_TIME = "08:30";
export const CLOSE_TIME = "23:00";
export const SLOT_INTERVAL_MINUTES = 30;
export const MAX_BOOKING_HOURS = 5; // user-confirmed cap
export const MAX_DURATION_MINUTES = MAX_BOOKING_HOURS * 60;
export const MAX_SLOTS_PER_BOOKING = MAX_DURATION_MINUTES / SLOT_INTERVAL_MINUTES;
export const TOTAL_SLOTS = Math.round(
  (toMinutes(CLOSE_TIME) - toMinutes(OPEN_TIME)) / SLOT_INTERVAL_MINUTES
);
