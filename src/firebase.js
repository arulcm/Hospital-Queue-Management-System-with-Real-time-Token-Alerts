import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4nEDgLL4rcVYBU9J2Hqxw-cQ33KAvgpU",
  authDomain: "waitless-70b00.firebaseapp.com",
  projectId: "waitless-70b00",
  storageBucket: "waitless-70b00.firebasestorage.app",
  messagingSenderId: "495726580374",
  appId: "1:495726580374:web:e6427a8ac15873df4ce8b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
