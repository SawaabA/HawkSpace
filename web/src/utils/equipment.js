export function hasAllEquipment(roomEquip = [], wanted = []) {
  if (!wanted.length) return true;
  const set = new Set(roomEquip.map((e) => e.toLowerCase()));
  return wanted.every((w) => set.has(w.toLowerCase()));
}
