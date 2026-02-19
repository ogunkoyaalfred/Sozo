// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBW_Go-zLZluFwUoaKd3BmN7PhEyqt3W_o",
  authDomain: "expenses-app-440c6.firebaseapp.com",
  projectId: "expenses-app-440c6",
  storageBucket: "expenses-app-440c6.firebasestorage.app",
  messagingSenderId: "617497262641",
  appId: "1:617497262641:web:12add65715ab98d07e3310",
  measurementId: "G-VR1GXJKMNV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);