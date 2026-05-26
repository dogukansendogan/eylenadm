// Authentication Context for Admin Panel
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

// Auth bağlamını oluştur
const AuthContext = createContext();

// AuthProvider — Admin role doğrulaması dahil
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Firestore'dan admin rolünü kontrol et
  async function checkAdminRole(user) {
    if (!user) {
      setIsAdmin(false);
      return false;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().role === "admin") {
        setIsAdmin(true);
        return true;
      }
      setIsAdmin(false);
      return false;
    } catch {
      setIsAdmin(false);
      return false;
    }
  }

  // Kullanıcı girişi + admin kontrolü
  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const adminStatus = await checkAdminRole(credential.user);
    if (!adminStatus) {
      // Admin olmayan kullanıcıyı çıkış yaptır
      await signOut(auth);
      throw new Error("Bu hesap yönetici yetkisine sahip değil.");
    }
    return credential;
  }

  // Çıkış yap
  function logout() {
    setIsAdmin(false);
    return signOut(auth);
  }

  // Auth durumunda değişiklik olduğunda
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkAdminRole(user);
      } else {
        setIsAdmin(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Auth bağlamını kullanmak için hook
export function useAuth() {
  return useContext(AuthContext);
}