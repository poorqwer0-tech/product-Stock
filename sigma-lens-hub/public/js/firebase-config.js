// นำเข้า Firebase SDK ผ่าน CDN (สำหรับหน้าเว็บ HTML / Vanilla JS)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ชุด Firebase Configuration ของคุณหยู
const firebaseConfig = {
  apiKey: "AIzaSyDwMX4azBgwyWZc1Ih97o7trE_7CtupoIs",
  authDomain: "sigma-lens-hub.firebaseapp.com",
  projectId: "sigma-lens-hub",
  storageBucket: "sigma-lens-hub.firebasestorage.app",
  messagingSenderId: "589364148505",
  appId: "1:589364148505:web:608d0b2c8142beac11ad88",
  measurementId: "G-0N714JCKQ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ส่งออกบริการ Auth และ Firestore DB เพื่อใช้ใน admin.js และ main.js
export const auth = getAuth(app);
export const db = getFirestore(app);