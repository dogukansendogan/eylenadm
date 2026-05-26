// Private Route component for admin check
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Korumalı rotalar — Admin yetkisi gerektirir
export default function PrivateRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();

  // Kullanıcı giriş yapmamışsa veya admin değilse, login sayfasına yönlendir
  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Admin kullanıcı — içeriği göster
  return children;
}