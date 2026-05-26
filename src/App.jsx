import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Villalar from "./pages/Villalar";
import ReservationDetail from "./pages/ReservationDetail";
import Reservations from "./pages/Reservations";
import Users from './pages/Users';
import Kuponlar from './pages/Kuponlar';
import Timeline from './pages/Timeline';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
        <Routes>
          {/* Ana rota, dashboard'a yönlendir */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Giriş sayfası */}
          <Route path="/login" element={<Login />} />
          
          {/* Korumalı rotalar */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Villa Yönetimi sayfası */}
          <Route 
            path="/villas" 
            element={
              <PrivateRoute>
                <Villalar />
              </PrivateRoute>
            } 
          />
          
          {/* Rezervasyon Yönetimi sayfaları */}
          <Route 
            path="/reservations" 
            element={
              <PrivateRoute>
                <Reservations />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/reservations/:id" 
            element={
              <PrivateRoute>
                <ReservationDetail />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/users" 
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            } 
          />


          {/* Kupon Yönetimi Sayfası */}
          <Route 
            path="/kuponlar" 
            element={
              <PrivateRoute>
                <Kuponlar />
              </PrivateRoute>
            } 
          />

          {/* Zaman Çizelgesi (Timeline) Sayfası */}
          <Route 
            path="/timeline" 
            element={
              <PrivateRoute>
                <Timeline />
              </PrivateRoute>
            } 
          />
          
          {/* 404 sayfası */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
