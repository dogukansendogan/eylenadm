import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function MainLayout({ children, title }) {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {

    }
  }

  const navLinks = [
    { to: "/dashboard", label: "Ana Sayfa" },
    { to: "/villas", label: "Villalar" },
    { to: "/reservations", label: "Rezervasyonlar" },
    { to: "/timeline", label: "Zaman Çizelgesi" },
    { to: "/kuponlar", label: "Kuponlar" },
    { to: "/users", label: "Kullanıcılar" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050608] text-slate-900 dark:text-neutral-100 font-sans tracking-tight transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-primary-500/5 to-transparent rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-accent-500/3 to-transparent rounded-full filter blur-[120px]" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-neutral-950/80 border-b border-slate-200 dark:border-white/5 backdrop-blur-xl px-8 z-50 items-center justify-between shadow-lg transition-colors duration-300">
        <div className="flex items-center">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg group-hover:shadow-lg-glow transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-5 h-5 text-neutral-950 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-800 via-slate-600 to-slate-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent transition-colors duration-300">
              Villa Admin
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-1.5 flex-1 justify-center px-4">
          {navLinks.map((item) => {
            const isActive = window.location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-bold shadow-inner"
                    : "text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-neutral-200 font-bold"
                  }`}
              >
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-300 dark:hover:bg-white/10 transition-all duration-300"
            title={isDarkMode ? "Açık Temaya Geç" : "Karanlık Temaya Geç"}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-1.5 px-3 shadow-inner transition-colors duration-300">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-primary-400 font-bold text-xs shadow-sm flex-shrink-0">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-[11px] text-slate-700 dark:text-neutral-300 font-medium tracking-wide max-w-[120px] truncate transition-colors">
              {currentUser?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-red-400 transition-all duration-300"
            title="Çıkış Yap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-neutral-950/60 border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-neutral-950 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent transition-colors duration-300">
            Villa Admin
          </span>
        </Link>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 active:scale-95 transition-all"
            title={isDarkMode ? "Açık Temaya Geç" : "Karanlık Temaya Geç"}
          >
            {isDarkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button
          onClick={handleLogout}
          className="p-2 rounded-lg border border-red-500/10 bg-red-950/10 text-red-400 active:scale-95 transition-all"
          title="Çıkış Yap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-lg border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl z-50 flex justify-around items-center px-2 transition-colors duration-300">
        {navLinks.map((link) => {
          const isActive = window.location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'text-primary-600 dark:text-primary-500 scale-105' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
            >
              <span className="text-[11px] font-bold tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="lg:pt-20 min-h-screen flex flex-col z-10 relative">
        <main className="flex-1 py-8 px-6 lg:py-12 lg:px-10 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {title && (
            <div className="mb-10 animate-fade-in">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent tracking-tight transition-colors duration-300">
                {title}
              </h2>
              <div className="w-12 h-1 bg-primary-500/80 rounded-full mt-3"></div>
            </div>
          )}

          <div className="animate-fade-in">
            {children}
          </div>
        </main>

        <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-neutral-950/20 py-6 px-6 lg:px-10 text-center transition-colors duration-300">
          <p className="text-xs text-slate-500 dark:text-neutral-600 font-medium">
            © {new Date().getFullYear()} Villa Yönetim Sistemi. Tüm hakları saklıdır.
          </p>
        </footer>
      </div>
    </div>
  );
}