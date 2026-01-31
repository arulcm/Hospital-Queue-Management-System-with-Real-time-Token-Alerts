// Simple Firebase API Test
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Your production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4nEDgLL4rcVYBU9J2Hqxw-cQ33KAvgpU",
  authDomain: "waitless-70b00.firebaseapp.com",
  projectId: "waitless-70b00",
  storageBucket: "waitless-70b00.firebasestorage.app",
  messagingSenderId: "495726580374",
  appId: "1:495726580374:web:e6427a8ac15873df4ce8b7"
};

// Test Firebase API
export const testFirebaseAPI = async () => {
  console.log('🔍 Testing Firebase API with production config...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    
    // Test Auth
    const auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    
    // Test Firestore
    const db = getFirestore(app);
    console.log('✅ Firebase Firestore initialized');
    
    // Test database read
    const hospitalsCollection = collection(db, 'hospitals');
    const snapshot = await getDocs(hospitalsCollection);
    console.log(`✅ Database read successful - found ${snapshot.size} hospitals`);
    
    // Test with a sample hospital if exists
    if (snapshot.size > 0) {
      const firstHospital = snapshot.docs[0];
      const hospitalData = firstHospital.data();
      console.log('✅ Sample hospital data:', hospitalData.hospitalName);
      
      // Test nested collection access
      try {
        const departmentsCollection = collection(db, `hospitals/${firstHospital.id}/departments`);
        const deptSnapshot = await getDocs(departmentsCollection);
        console.log(`✅ Departments accessible: ${deptSnapshot.size} found`);
      } catch (deptError) {
        console.log('⚠️ Departments access issue:', deptError.message);
      }
    }
    
    return {
      success: true,
      message: 'Firebase API is working correctly',
      hospitals: snapshot.size,
      config: 'Production'
    };
    
  } catch (error) {
    console.error('❌ Firebase API test failed:', error);
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'Firebase API has issues'
    };
  }
};

// Test Authentication (optional)
export const testAuth = async () => {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Try to get current user (no login required)
    const currentUser = auth.currentUser;
    console.log('✅ Auth service working, current user:', currentUser ? 'Logged in' : 'Not logged in');
    
    return {
      success: true,
      authWorking: true,
      currentUser: currentUser ? 'Logged in' : 'Not logged in'
    };
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const runProductionAPITest = async () => {
  console.log('🚀 Running Production Firebase API Test...');
  
  const apiTest = await testFirebaseAPI();
  const authTest = await testAuth();
  
  return {
    api: apiTest,
    auth: authTest,
    overall: apiTest.success && authTest.success
  };
};
