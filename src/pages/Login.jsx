import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Sayfa yüklendiğinde animasyonu başlat
    setShowAnimation(true);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-email") {
        setError("Geçersiz e-posta formatı.");
      } else if (code === "auth/network-request-failed" || err?.message?.toLowerCase().includes("network")) {
        setError("Sistem bağlantısı kurulamadı. Lütfen ağınızı kontrol edin.");
      } else {
        setError("Yönetici bilgileri hatalı veya geçersiz.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500 rounded-full opacity-5 filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 -right-24 w-80 h-80 bg-primary-500 rounded-full opacity-5 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary-500 rounded-full opacity-5 filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="fixed left-4 inset-y-1/3 flex items-center justify-center h-1/3 transform -rotate-90 origin-center z-10 text-neutral-400 dark:text-neutral-600 text-sm tracking-[0.2em] font-light hidden lg:flex uppercase">
        MSVSoft Yazılım ve Bilişim Sistemleri
      </div>
      
      <div className="fixed right-4 inset-y-1/3 flex items-center justify-center h-1/3 transform rotate-90 origin-center z-10 text-neutral-400 dark:text-neutral-600 text-sm tracking-[0.2em] font-light hidden lg:flex uppercase">
        MSVSoft Yazılım ve Bilişim Sistemleri
      </div>
      
      <div className={`relative z-10 w-full max-w-md transition-all duration-1000 transform ${showAnimation ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(197,160,89,0.08)] border border-neutral-200/50 dark:border-white/10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-2 tracking-wide">
            Eylen Villa Yönetimi
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm mb-8">
            Yönetim panelinize erişmek için giriş yapın
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold tracking-wide mt-3 text-center" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="pl-10 block w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all duration-300 text-sm"
                />
              </div>
            </div>
            
            <div className="group">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10 block w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all duration-300 text-sm"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? "Giriş yapılıyor..." : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş Yap
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-500">
            © {new Date().getFullYear()} Eylen Villa. Tüm hakları saklıdır.
          </div>
          <div className="mt-2 text-center text-[10px] text-neutral-400 dark:text-neutral-600">
            MSVSoft tarafından tasarlanmıştır
          </div>
        </div>
        
        <div className="mt-6 text-center text-neutral-400 dark:text-neutral-600 text-xs tracking-wide lg:hidden uppercase">
          MSVSoft Yazılım ve Bilişim Sistemleri
        </div>
      </div>
    </div>
  );
} 