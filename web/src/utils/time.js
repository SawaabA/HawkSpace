export function timesOverlap(aStart, aEnd, bStart, bEnd) {
  // all "HH:MM" 24h strings
  return aStart < bEnd && bStart < aEnd;
}
