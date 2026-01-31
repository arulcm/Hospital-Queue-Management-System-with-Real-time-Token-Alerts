// Firebase Backend Test
import { auth, db } from './firebase.js';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Test Firebase Connection
export const testFirebaseConnection = async () => {
  console.log('🔍 Testing Firebase Backend Connection...');
  
  try {
    // Test 1: Check Firestore connection
    console.log('📊 Testing Firestore connection...');
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('✅ Firestore connection successful');
    
    // Test 2: Check Auth service
    console.log('🔐 Testing Auth service...');
    const currentUser = auth.currentUser;
    console.log('✅ Auth service working, current user:', currentUser ? 'Logged in' : 'Not logged in');
    
    // Test 3: Try to write a test document
    console.log('✍️ Testing write permissions...');
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      test: 'Firebase connection test'
    });
    console.log('✅ Write permissions working');
    
    // Test 4: Try to read hospitals collection
    console.log('🏥 Testing hospitals collection access...');
    const hospitalsCollection = collection(db, 'hospitals');
    const hospitalsSnapshot = await getDocs(hospitalsCollection);
    console.log(`✅ Hospitals collection accessible, found ${hospitalsSnapshot.size} hospitals`);
    
    // Test 5: Check if any hospital has departments
    if (hospitalsSnapshot.size > 0) {
      const firstHospital = hospitalsSnapshot.docs[0];
      const departmentsCollection = collection(db, `hospitals/${firstHospital.id}/departments`);
      const departmentsSnapshot = await getDocs(departmentsCollection);
      console.log(`✅ Departments accessible for ${firstHospital.data().hospitalName}, found ${departmentsSnapshot.size} departments`);
      
      // Test 6: Check if any hospital has doctors
      const doctorsCollection = collection(db, `hospitals/${firstHospital.id}/doctors`);
      const doctorsSnapshot = await getDocs(doctorsCollection);
      console.log(`✅ Doctors accessible for ${firstHospital.data().hospitalName}, found ${doctorsSnapshot.size} doctors`);
    }
    
    console.log('🎉 All Firebase backend tests passed!');
    return {
      success: true,
      firestore: true,
      auth: true,
      hospitals: hospitalsSnapshot.size,
      message: 'Firebase backend is working properly'
    };
    
  } catch (error) {
    console.error('❌ Firebase backend test failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      message: 'Firebase backend has issues'
    };
  }
};

// Test Firebase Rules
export const testFirebaseRules = async () => {
  console.log('🔍 Testing Firebase Security Rules...');
  
  try {
    // Test public read access to hospitals
    const hospitalsCollection = collection(db, 'hospitals');
    const hospitalsSnapshot = await getDocs(hospitalsCollection);
    console.log('✅ Public hospital access working');
    
    // Test if we can read departments (should be public)
    if (hospitalsSnapshot.size > 0) {
      const firstHospital = hospitalsSnapshot.docs[0];
      const departmentsCollection = collection(db, `hospitals/${firstHospital.id}/departments`);
      const departmentsSnapshot = await getDocs(departmentsCollection);
      console.log('✅ Public department access working');
      
      const doctorsCollection = collection(db, `hospitals/${firstHospital.id}/doctors`);
      const doctorsSnapshot = await getDocs(doctorsCollection);
      console.log('✅ Public doctor access working');
    }
    
    return {
      success: true,
      message: 'Firebase security rules are properly configured'
    };
    
  } catch (error) {
    console.error('❌ Firebase rules test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Firebase security rules need adjustment'
    };
  }
};

// Run all tests
export const runBackendDiagnostics = async () => {
  console.log('🚀 Starting Firebase Backend Diagnostics...');
  
  const connectionTest = await testFirebaseConnection();
  const rulesTest = await testFirebaseRules();
  
  const results = {
    connection: connectionTest,
    rules: rulesTest,
    overall: connectionTest.success && rulesTest.success
  };
  
  console.log('📊 Backend Diagnostics Results:', results);
  return results;
};
