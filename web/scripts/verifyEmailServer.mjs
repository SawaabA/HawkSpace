import express from 'express';
import cors from 'cors';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
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
        'Download it from Firebase Console → Project settings → Service accounts.'
    );
  }
}

// Initialize Firebase Admin
let auth;
try {
  const serviceAccount = await loadServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
  auth = getAuth();
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin:', err.message);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Verify email endpoint
app.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`Verifying email for: ${email}`);
    const userRecord = await auth.getUserByEmail(email);
    
    await auth.updateUser(userRecord.uid, {
      emailVerified: true,
    });
    
    console.log(`✅ Email verified for: ${email}`);
    res.json({ success: true, message: `Email verified for ${email}` });
  } catch (err) {
    console.error('Error verifying email:', err);
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Email verification server running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/verify-email`);
});

