import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
  const email = process.argv[2];
  const password = process.argv[3] || 'Admin123!';
  const displayName = process.argv[4] || 'Admin User';

  if (!email || !email.endsWith('@mylaurier.ca')) {
    console.error('Usage: node createAdminUser.mjs admin@mylaurier.ca [password] [displayName]');
    console.error('Email must end with @mylaurier.ca');
    process.exit(1);
  }

  const serviceAccount = await loadServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth();
  const db = getFirestore();

  console.log(`Creating admin user: ${email}`);

  // Create or get user
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`User already exists: ${userRecord.uid}`);
  } catch {
    userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Auto-verify for admin
    });
    console.log(`Created new user: ${userRecord.uid}`);
  }

  // Set admin custom claims
  await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
  console.log('✅ Set custom claims: role=admin');

  // Ensure Firestore profile with admin role
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: displayName,
    role: 'admin',
    createdAt: FieldValue.serverTimestamp(),
    lastLoginAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('✅ Created Firestore profile with role=admin');

  console.log(`\n🎉 Admin user ready!`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: admin`);
  console.log(`\nYou can now log in at: http://localhost:5173/login?intent=admin`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

