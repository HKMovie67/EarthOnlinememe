// ==================== Firebase 設定 ====================
// Project: earth-online-meme
// Config from Firebase Console

const firebaseConfig = {
  apiKey: "AIzaSyBoY8zq4uKbgbZjAxIaWqV6TI_opuvfa9A",
  authDomain: "earth-online-meme.firebaseapp.com",
  databaseURL: "https://earth-online-meme-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "earth-online-meme",
  storageBucket: "earth-online-meme.firebasestorage.app",
  messagingSenderId: "408124148919",
  appId: "1:408124148919:web:feefcd5adf7359d202d132"
};

// Initialize Firebase (compat SDK, loaded via CDN in index.html)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();

console.log("🔥 Firebase initialized: earth-online-meme");
