import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultKeyPath = path.resolve(__dirname, '../serviceAccountKey.json');
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

  if (!email) {
    console.error('Usage: node verifyUserEmail.mjs user@mylaurier.ca');
    process.exit(1);
  }

  const serviceAccount = await loadServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth();

  console.log(`Verifying email for user: ${email}`);

  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid}`);
    
    // Update user to mark email as verified
    await auth.updateUser(userRecord.uid, {
      emailVerified: true,
    });
    
    console.log(`✅ Email verified successfully for ${email}`);
    console.log(`   User ID: ${userRecord.uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.error(`❌ Error: ${err.message}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

