
import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore,FieldValue } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };
console.log("TEST SCRIPT STARTED");
// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

// Connect to Firestore
const db = getFirestore();

// Test function
async function testFirestore() {
    console.log("FIRESTORE TEST STARTED");
  try {
    // Add a test document to Firestore
    const docRef = await db.collection('users').add({
      username: 'TestUser',
      coins: 100,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log('Successfully connected to Firestore!');
    console.log('Document ID:', docRef.id);

    // Read the document back to verify the data
    const doc = await docRef.get();

    console.log('Retrieved data:', doc.data());

  } catch (error) {
    console.error('Firestore connection failed:', error);
    process.exitCode = 1;
  } finally {
    // Close Firebase connection
    await app().delete();
  }
}

testFirestore();
