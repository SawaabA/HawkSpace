import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { ROOMS } from "@/data/rooms";

export async function seedRooms() {
  const tasks = ROOMS.map(async (room) => {
    const ref = doc(db, "rooms", room.id);
    await setDoc(
      ref,
      {
        ...room,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
  await Promise.all(tasks);
  alert(`Seeded ${ROOMS.length} rooms with IDs.`);
}
