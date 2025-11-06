// src/utils/seedRooms.js
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function seedRooms() {
  const rooms = [
    { name: "SB201", building: "Science", capacity: 30, equipment: ["projector", "whiteboard"], active: true },
    { name: "SB105", building: "Science", capacity: 12, equipment: ["whiteboard"], active: true },
    { name: "LH101", building: "Lazaridis Hall", capacity: 80, equipment: ["projector", "hdmi", "speakers"], active: true },
    { name: "P101",  building: "Peters", capacity: 20, equipment: ["projector"], active: true },

    // add more here:
    { name: "LH205", building: "Lazaridis Hall", capacity: 40, equipment: ["projector", "speakers"], active: true },
    { name: "SB310", building: "Science",       capacity: 25, equipment: ["whiteboard", "hdmi"], active: true },
    { name: "P210",  building: "Peters",        capacity: 18, equipment: ["projector", "whiteboard"], active: true },
  ];

  const col = collection(db, "rooms");
  for (const r of rooms) await addDoc(col, r);
  alert("Seeded rooms 👍");
}
