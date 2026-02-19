import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function testFirebaseConnection() {
  console.log('🔍 Testing Firebase Connection...');
  console.log('📋 Firebase Config:', {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  });

  try {
    // Test 1: Check if db is initialized
    console.log('✅ Firestore instance exists:', !!db);

    // Test 2: Try to list all collections (this will list what we find)
    console.log('\n📚 Testing collection access...');

    // Test 3: Try to read volunteers without filters
    try {
      console.log('\n🧪 Test 1: Read ALL volunteers (no filters)');
      const volunteersRef = collection(db, 'volunteers');
      const snapshot = await getDocs(volunteersRef);
      console.log(`✅ Found ${snapshot.size} volunteer documents`);
      
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0];
        console.log('📄 First document ID:', firstDoc.id);
        console.log('📄 First document data:', firstDoc.data());
      } else {
        console.log('⚠️ No volunteer documents found in database');
      }
    } catch (error: any) {
      console.error('❌ Error reading volunteers:', error.message);
      console.error('Error code:', error.code);
      if (error.code === 'permission-denied') {
        console.log('💡 This might be a security rules issue');
      }
    }

    // Test 4: Try to read events
    try {
      console.log('\n🧪 Test 2: Read ALL events (no filters)');
      const eventsRef = collection(db, 'events');
      const snapshot = await getDocs(eventsRef);
      console.log(`✅ Found ${snapshot.size} event documents`);
      
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0];
        console.log('📄 First document ID:', firstDoc.id);
        console.log('📄 First document data:', firstDoc.data());
      } else {
        console.log('⚠️ No event documents found in database');
      }
    } catch (error: any) {
      console.error('❌ Error reading events:', error.message);
      console.error('Error code:', error.code);
    }

    // Test 5: Try to read departments
    try {
      console.log('\n🧪 Test 3: Read ALL departments (no filters)');
      const deptsRef = collection(db, 'departments');
      const snapshot = await getDocs(deptsRef);
      console.log(`✅ Found ${snapshot.size} department documents`);
      
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0];
        console.log('📄 First document ID:', firstDoc.id);
        console.log('📄 First document data:', firstDoc.data());
      } else {
        console.log('⚠️ No department documents found in database');
      }
    } catch (error: any) {
      console.error('❌ Error reading departments:', error.message);
      console.error('Error code:', error.code);
    }

    console.log('\n✅ Firebase connection test complete!');
    return true;
  } catch (error: any) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testFirebase = testFirebaseConnection;
}
