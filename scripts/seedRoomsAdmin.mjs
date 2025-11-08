import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { ROOMS } from '../web/src/data/rooms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultKeyPath = path.resolve(__dirname, '../web/serviceAccountKey.json');
const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT || defaultKeyPath;

async function loadServiceAccount() {
  try {
    const raw = await readFile(keyPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to read service account JSON at ${keyPath}. ` +
        'Download it from Firebase Console → Project settings → Service accounts and set FIREBASE_SERVICE_ACCOUNT to its path.'
    );
  }
}

async function main() {
  const serviceAccount = await loadServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  for (const room of ROOMS) {
    await db.collection('rooms').doc(room.id).set(
      {
        ...room,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`Seeded room ${room.id}`);
  }

  console.log(`\nDone! Seeded ${ROOMS.length} rooms.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
