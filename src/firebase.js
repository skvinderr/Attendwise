// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDL9SBAe9T5KXDUOc9zxHrKAfeAUEY2szE",
  authDomain: "attendwise-tracker-app.firebaseapp.com",
  projectId: "attendwise-tracker-app",
  storageBucket: "attendwise-tracker-app.firebasestorage.app",
  messagingSenderId: "1042613740448",
  appId: "1:1042613740448:web:d569d29e0618f397a97ac5",
  measurementId: "G-X2TN47K2YC"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you'll need in other parts of your app
export const auth = getAuth(app);
export const db = getFirestore(app);