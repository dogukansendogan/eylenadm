/**
 * Admin kullanıcısına Firestore'da role: 'admin' atar
 * 
 * Kullanım:
 *   1. Proje kökündeki .env dosyasına Firebase bilgilerinizi girin
 *   2. ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=şifre node set-admin-role.mjs
 */

import { config } from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// .env dosyasından ortam değişkenlerini yükle
config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// --- Admin giriş bilgileri ortam değişkenlerinden alınır ---
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Hata: ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gereklidir.");
  console.error("   Kullanım: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=şifre node set-admin-role.mjs");
  process.exit(1);
}

if (!firebaseConfig.apiKey) {
  console.error("❌ Hata: Firebase yapılandırması eksik. .env dosyasını kontrol edin.");
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

try {
  // 1. Giriş yap
  console.log("🔐 Firebase'e giriş yapılıyor...");
  const credential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  const uid = credential.user.uid;
  console.log("   UID:", uid);

  // 2. Mevcut dokümanı kontrol et
  const userRef  = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Kayıt varsa sadece role alanını güncelle
    await setDoc(userRef, { role: "admin" }, { merge: true });
    console.log("✅ Mevcut kullanıcı kaydına role: 'admin' eklendi.");
  } else {
    // Kayıt yoksa oluştur
    await setDoc(userRef, {
      uid,
      email: ADMIN_EMAIL,
      role: "admin",
      createdAt: new Date(),
    });
    console.log("✅ Firestore'da yeni admin kaydı oluşturuldu.");
  }

  console.log("\nArtık Storage'a görsel yükleyebilirsiniz.");
} catch (error) {
  console.error("❌ Hata:", error.code, error.message);
}

process.exit(0);
