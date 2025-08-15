// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you'll need in other parts of your app
export const auth = getAuth(app);

export const db = getFirestore(app);
