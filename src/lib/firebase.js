import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA-nAC9AeZMei7weSA9KrI0ITzsHGlk0cc",
  authDomain: "luxury-counter.firebaseapp.com",
  databaseURL: "https://luxury-counter-default-rtdb.firebaseio.com",
  projectId: "luxury-counter",
  storageBucket: "luxury-counter.firebasestorage.app",
  messagingSenderId: "380288570955",
  appId: "1:380288570955:web:d83abaf3665cbcedb19fce",
  measurementId: "G-FGDJKFSNGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
