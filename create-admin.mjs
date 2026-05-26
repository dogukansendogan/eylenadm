/**
 * Admin kullanıcısı oluşturma scripti
 * 
 * Kullanım:
 *   1. Proje kökündeki .env dosyasına Firebase bilgilerinizi girin
 *   2. node create-admin.mjs
 * 
 * Bu script Firebase Authentication'a bir admin kullanıcısı ekler.
 * Sadece bir kez çalıştırmanız yeterlidir.
 */

import { config } from "dotenv";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

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

// --- Admin bilgilerini komut satırından veya ortam değişkenlerinden alın ---
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Hata: ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gereklidir.");
  console.error("   Kullanım: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=GüçlüŞifre123! node create-admin.mjs");
  process.exit(1);
}

if (!firebaseConfig.apiKey) {
  console.error("❌ Hata: Firebase yapılandırması eksik. .env dosyasını kontrol edin.");
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

try {
  const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log("✅ Admin kullanıcısı başarıyla oluşturuldu!");
  console.log("   E-posta :", userCredential.user.email);
  console.log("   UID     :", userCredential.user.uid);
} catch (error) {
  if (error.code === "auth/email-already-in-use") {
    console.log("ℹ️  Bu e-posta adresi zaten kayıtlı. Doğrudan giriş yapabilirsiniz.");
  } else {
    console.error("❌ Hata:", error.code, error.message);
  }
}

process.exit(0);
