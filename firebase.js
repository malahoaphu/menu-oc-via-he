import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvwT_RfH5apvm_4uFScfNlOcAvWhV6AvQ",
  authDomain: "menu-oc-via-he.firebaseapp.com",
  databaseURL: "https://menu-oc-via-he-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "menu-oc-via-he",
  storageBucket: "menu-oc-via-he.firebasestorage.app",
  messagingSenderId: "450527362154",
  appId: "1:450527362154:web:0f7aed27ace823f9061e13",
  measurementId: "G-RH25H7BR48"
};


// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export để dùng ở các file khác
export { db, ref, onValue, set, remove };