// Firebase Backend Test
import { auth, db } from './firebase.js';
import { collection, getDocs, doc, setDoc, query, where, limit } from 'firebase/firestore';

// Test Firebase Connection
export const testFirebaseConnection = async () => {
  console.log('🔍 Testing Firebase Backend Connection...');
  
  try {
    // Test 1: Check Firestore connection (read-only)
    console.log('📊 Testing Firestore connection...');
    const hospitalsCollection = collection(db, 'hospitals');
    const snapshot = await getDocs(hospitalsCollection);
    console.log('✅ Firestore connection successful');
    
    // Test 2: Check Auth service
    console.log('🔐 Testing Auth service...');
    const currentUser = auth.currentUser;
    console.log('✅ Auth service working, current user:', currentUser ? 'Logged in' : 'Not logged in');
    
    // Test 3: Check hospitals count
    console.log('🏥 Testing hospitals collection access...');
    const hospitalsCount = snapshot.size;
    console.log(`✅ Hospitals collection accessible, found ${hospitalsCount} hospitals`);
    
    let departmentsCount = 0;
    let doctorsCount = 0;
    
    // Test 4: Check departments (if hospitals exist)
    if (hospitalsCount > 0) {
      const firstHospital = snapshot.docs[0];
      const hospitalName = firstHospital.data().hospitalName || 'Unknown Hospital';
      console.log(`🏢 Checking departments for: ${hospitalName}`);
      
      try {
        const departmentsCollection = collection(db, `hospitals/${firstHospital.id}/departments`);
        const departmentsSnapshot = await getDocs(departmentsCollection);
        departmentsCount = departmentsSnapshot.size;
        console.log(`✅ Departments accessible, found ${departmentsCount} departments`);
        
        // Test 5: Check doctors
        try {
          const doctorsCollection = collection(db, `hospitals/${firstHospital.id}/doctors`);
          const doctorsSnapshot = await getDocs(doctorsCollection);
          doctorsCount = doctorsSnapshot.size;
          console.log(`✅ Doctors accessible, found ${doctorsCount} doctors`);
        } catch (doctorError) {
          console.log('⚠️ Doctors collection not accessible:', doctorError.message);
        }
        
      } catch (deptError) {
        console.log('⚠️ Departments collection not accessible:', deptError.message);
      }
    }
    
    console.log('🎉 Firebase backend connection test completed!');
    return {
      success: true,
      firestore: true,
      auth: true,
      hospitals: hospitalsCount,
      departments: departmentsCount,
      doctors: doctorsCount,
      message: 'Firebase backend connection is working'
    };
    
  } catch (error) {
    console.error('❌ Firebase backend test failed:', error);
    
    // Provide specific error guidance
    let errorType = 'unknown';
    let solution = 'Check Firebase configuration';
    
    if (error.code === 'permission-denied') {
      errorType = 'permission';
      solution = 'Update Firestore security rules in Firebase Console';
    } else if (error.code === 'unavailable' || error.code === 'unauthenticated') {
      errorType = 'authentication';
      solution = 'Check Firebase project configuration and API keys';
    } else if (error.code === 'not-found') {
      errorType = 'collection';
      solution = 'Create initial data by registering a hospital';
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      type: errorType,
      solution: solution,
      message: `Firebase backend issue: ${errorType}`
    };
  }
};

// Test Firebase Rules (read-only)
export const testFirebaseRules = async () => {
  console.log('🔍 Testing Firebase Security Rules...');
  
  try {
    // Test public read access to hospitals
    const hospitalsCollection = collection(db, 'hospitals');
    const hospitalsSnapshot = await getDocs(hospitalsCollection);
    console.log('✅ Public hospital access working');
    
    let rulesStatus = 'Basic access working';
    
    // Test if we can read departments (should be public)
    if (hospitalsSnapshot.size > 0) {
      const firstHospital = hospitalsSnapshot.docs[0];
      
      try {
        const departmentsCollection = collection(db, `hospitals/${firstHospital.id}/departments`);
        const departmentsSnapshot = await getDocs(departmentsCollection);
        console.log('✅ Public department access working');
        
        try {
          const doctorsCollection = collection(db, `hospitals/${firstHospital.id}/doctors`);
          const doctorsSnapshot = await getDocs(doctorsCollection);
          console.log('✅ Public doctor access working');
          rulesStatus = 'All public access working';
        } catch (doctorError) {
          console.log('⚠️ Public doctor access restricted');
          rulesStatus = 'Partial access (doctors restricted)';
        }
      } catch (deptError) {
        console.log('⚠️ Public department access restricted');
        rulesStatus = 'Limited access (departments restricted)';
      }
    }
    
    return {
      success: true,
      status: rulesStatus,
      message: `Firebase security rules: ${rulesStatus}`
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
