import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import MainLayout from "../components/MainLayout";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoadingStats(true);
        const villasSnap = await getDocs(collection(db, "villalar"));
        const usersSnap = await getDocs(collection(db, "users"));
        const reservationsSnap = await getDocs(collection(db, "reservations"));

        let activeReservations = 0;
        let monthlyEarnings = 0;

        reservationsSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === "approved" || data.status === "pending") {
            activeReservations++;
          }
          if (data.status === "approved" && data.totalPrice) {
            monthlyEarnings += Number(data.totalPrice) || 0;
          }
        });

        setStats({
          totalVillas: villasSnap.size,
          activeReservations,
          totalUsers: usersSnap.size,
          monthlyEarnings
        });
      } catch (error) {
        setStats({
          totalVillas: 0,
          activeReservations: 0,
          totalUsers: 0,
          monthlyEarnings: 0
        });
      } finally {
        setLoadingStats(false);
      }
    }

    fetchStats();
  }, []);

  const features = [
    {
      id: 1,
      title: "Villa Yönetimi",
      description: "Sistemdeki villaları listeleyin, düzenleyin veya yenilerini ekleyin.",
      icon: (
        <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      link: "/villas",
      linkText: "Villalara Git"
    },
    {
      id: 2,
      title: "Rezervasyon Yönetimi",
      description: "Rezervasyon durumlarını izleyin, onaylayın veya güncelleyin.",
      icon: (
        <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: "/reservations",
      linkText: "Rezervasyonlara Git"
    },
    {
      id: 3,
      title: "Kullanıcı Yönetimi",
      description: "Kayıtlı kullanıcı profillerini ve detaylarını inceleyin.",
      icon: (
        <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: "/users",
      linkText: "Kullanıcılara Git"
    },
    {
      id: 4,
      title: "Zaman Çizelgesi",
      description: "12 aylık rezervasyon doluluk takvimini analiz edin.",
      icon: (
        <svg className="h-5 w-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: "/timeline",
      linkText: "Çizelgeyi Görüntüle"
    }
  ];

  return (
    <MainLayout title="Genel Durum">
      <div className="space-y-12">
        <section className="animate-fade-in">
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-primary-500 rounded-full"></span>
            Hızlı İstatistikler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border border-neutral-200 dark:border-white/5 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                    <div className="w-16 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                  </div>
                  <div className="w-24 h-4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-3"></div>
                  <div className="w-16 h-8 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                </div>
              ))
            ) : (
              [
                { label: "Toplam Villa", value: stats?.totalVillas || 0, icon: "🏠", trend: "Aktif", trendClass: "bg-primary-500/10 text-primary-400" },
                { label: "Aktif Rezervasyon", value: stats?.activeReservations || 0, icon: "📅", trend: "+12.4% ↑", trendClass: "bg-primary-500/10 text-primary-400" },
                { label: "Toplam Kullanıcı", value: stats?.totalUsers || 0, icon: "👥", trend: "+8.2% ↑", trendClass: "bg-primary-500/10 text-primary-400" },
                { label: "Aylık Gelir", value: `₺${(stats?.monthlyEarnings || 0).toLocaleString('tr-TR')}`, icon: "📈", trend: "+18.9% ↑", trendClass: "bg-primary-500/10 text-primary-400" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-white/5 rounded-2xl p-6 group hover:shadow-lg-glow transition-all duration-300 hover:border-primary-500/20"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-300 select-none">
                      {stat.icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase ${stat.trendClass}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="font-mono tracking-wide text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-primary-500 rounded-full"></span>
            Yönetim Modülleri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="dashboard-card overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-400 transition-colors duration-300">{feature.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </div>

                <div className="dashboard-card-footer">
                  <Link
                    to={feature.link}
                    className="inline-flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider text-primary-400 hover:text-primary-300 transition-all duration-300 group-hover:gap-3"
                  >
                    <span>{feature.linkText}</span>
                    <svg className="w-5 h-5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-primary-500 rounded-full"></span>
            Son Aktiviteler
          </h3>
          <div className="card-base p-8">
            <div className="flex flex-col items-center justify-center h-40">
              <svg className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-semibold">Henüz aktivite kaydı bulunmamaktadır.</p>
              <p className="text-neutral-400 dark:text-neutral-600 text-xs mt-1">Yönetim işlemleri gerçekleştirmeye başladığınızda burada listelenecektir.</p>
            </div>
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-primary-500 rounded-full"></span>
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/villas"
              className="card-base p-6 group hover:shadow-lg-glow transition-all duration-300 flex items-center gap-4 hover:border-primary-500/20"
            >
              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/15 group-hover:bg-primary-500/20 transition-all duration-300">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white tracking-wide">Yeni Villa Ekle</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Sisteme yeni bir kiralık villa kaydedin.</p>
              </div>
            </Link>

            <Link
              to="/reservations"
              className="card-base p-6 group hover:shadow-lg-glow transition-all duration-300 flex items-center gap-4 hover:border-primary-500/20"
            >
              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/15 group-hover:bg-primary-500/20 transition-all duration-300">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white tracking-wide">Rezervasyonları İncele</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Müşteri rezervasyon taleplerini ve onaylananları izleyin.</p>
              </div>
            </Link>

            <Link
              to="/users"
              className="card-base p-6 group hover:shadow-lg-glow transition-all duration-300 flex items-center gap-4 hover:border-primary-500/20"
            >
              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/15 group-hover:bg-primary-500/20 transition-all duration-300">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white tracking-wide">Kullanıcıları Yönet</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Kullanıcı listesini ve erişim izinlerini denetleyin.</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="card-base p-6 border-l-4 border-primary-500 bg-gradient-to-r from-primary-50/50 dark:from-primary-950/10 to-transparent">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/15">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 tracking-wide">Yönetim Bilgilendirmesi</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Villalarınızın sezonluk fiyat matrisini ve doluluk tarihlerini güncel tutmak, web sitesindeki rezervasyon sürecinin sorunsuz çalışmasını sağlar. Herhangi bir çakışma durumunda çizelge sayfasından dolulukları manuel kontrol edebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}