// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsARH9zQjq5pM_45ANPV_V8RlfJyvaNZk",
  authDomain: "scrim-tool.firebaseapp.com",
  projectId: "scrim-tool",
  storageBucket: "scrim-tool.firebasestorage.app",
  messagingSenderId: "190597963223",
  appId: "1:190597963223:web:3f092cbe4bac797c03bf92"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
