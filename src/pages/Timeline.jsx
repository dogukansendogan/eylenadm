import React, { useState, useEffect, useMemo, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import QuickReservationModal from "../components/QuickReservationModal";
import { clearVillaBookedDatesRange, clearAllVillaBookedDates } from "../services/admin-reservationService";

const DAY_WIDTH = 50;

export default function Timeline() {
  const [villalar, setVillalar] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [modalAcik, setModalAcik] = useState(false);
  const [seciliTarih, setSeciliTarih] = useState("");
  const [seciliVillaId, setSeciliVillaId] = useState("");

  const [dolulukYonetimiAcik, setDolulukYonetimiAcik] = useState(false);
  const [temizlikVillaId, setTemizlikVillaId] = useState("");
  const [temizlikBaslangic, setTemizlikBaslangic] = useState("");
  const [temizlikBitis, setTemizlikBitis] = useState("");
  const [temizlemeYukleniyor, setTemizlemeYukleniyor] = useState(false);
  const [temizlikHata, setTemizlikHata] = useState("");
  const [temizlikMesaj, setTemizlikMesaj] = useState("");
  
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      
      const villasSnapshot = await getDocs(collection(db, "villalar"));
      const villasData = villasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const resQuery = query(
        collection(db, "reservations"),
        where("status", "!=", "rejected")
      );
      const resSnapshot = await getDocs(resQuery);
      const resData = resSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setVillalar(villasData);
      setReservations(resData);
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const today = new Date();
      const diffMs = today - startDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const scrollPos = Math.max(0, (diffDays * DAY_WIDTH) - 200);
      scrollRef.current.scrollLeft = scrollPos;
    }
  }, [loading]);

  const { daysArray, months, startDate } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const days = [];
    const monthsMap = new Map();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      days.push(d);
      
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          name: d.toLocaleDateString("tr-TR", { month: "long" }),
          year: d.getFullYear(),
          daysCount: 0
        });
      }
      const m = monthsMap.get(monthKey);
      m.daysCount++;
    }
    
    return { 
      daysArray: days, 
      months: Array.from(monthsMap.values()),
      startDate: start
    };
  }, []);

  const handleDayClick = (villaId, date) => {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                        .toISOString()
                        .split("T")[0];
    setSeciliVillaId(villaId);
    setSeciliTarih(localDate);
    setModalAcik(true);
  };

  const handleRezervasyonEklendi = (yeniRes) => {
    setReservations(prev => [...prev, yeniRes]);
  };

  const getVillaReservations = (villaId) => {
    return reservations.filter(r => r.villaId === villaId).map(res => {
      let rStart = res.startDate?.toDate ? res.startDate.toDate() : new Date(res.startDate);
      let rEnd = res.endDate?.toDate ? res.endDate.toDate() : new Date(res.endDate);
      
      if (isNaN(rStart.getTime()) || isNaN(rEnd.getTime())) {
        return null;
      }

      const s = new Date(rStart.getFullYear(), rStart.getMonth(), rStart.getDate());
      const e = new Date(rEnd.getFullYear(), rEnd.getMonth(), rEnd.getDate());
      
      const diffMs = s - startDate;
      const startIdx = Math.round(diffMs / (1000 * 60 * 60 * 24));
      
      const durationMs = e - s;
      const duration = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
      
      return {
        ...res,
        startIdx,
        duration,
        isPending: res.status === "pending" || res.status === "pending_approval"
      };
    }).filter(Boolean);
  };

  const getFiyatForDate = (villa, date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    
    const specialDailyPrices = villa.specialDailyPrices || {};
    if (specialDailyPrices[dateStr]) {
      return specialDailyPrices[dateStr];
    }

    const monthIndex = date.getMonth();
    const monthKeys = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    const monthKey = monthKeys[monthIndex];
    const seasonalPrices = villa.seasonalPrices || {};
    
    let fiyat = villa.normalFiyat || villa.fiyat || 0;
    if (seasonalPrices[monthKey]) {
      fiyat = seasonalPrices[monthKey];
    }
    return fiyat;
  };

  const buildOccupiedSet = (villa, villaReservations) => {
    const occupied = new Set();
    
    villaReservations.forEach(res => {
      let rStart = res.startDate?.toDate ? res.startDate.toDate() : new Date(res.startDate);
      let rEnd = res.endDate?.toDate ? res.endDate.toDate() : new Date(res.endDate);
      if (isNaN(rStart.getTime()) || isNaN(rEnd.getTime())) return;
      
      const current = new Date(rStart.getFullYear(), rStart.getMonth(), rStart.getDate());
      const end = new Date(rEnd.getFullYear(), rEnd.getMonth(), rEnd.getDate());
      
      while (current < end) {
        occupied.add(current.getTime());
        current.setDate(current.getDate() + 1);
      }
    });

    const doluTarihler = villa.doluTarihler || [];
    doluTarihler.forEach(dateStr => {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        occupied.add(d.getTime());
      }
    });

    return occupied;
  };

  const handleTemizleAralik = async () => {
    if (!temizlikVillaId || !temizlikBaslangic || !temizlikBitis) {
      setTemizlikHata("Lütfen villa ve tarih aralığı seçin.");
      return;
    }
    if (new Date(temizlikBaslangic) > new Date(temizlikBitis)) {
      setTemizlikHata("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }
    try {
      setTemizlemeYukleniyor(true);
      setTemizlikHata("");
      setTemizlikMesaj("");
      await clearVillaBookedDatesRange(temizlikVillaId, temizlikBaslangic, temizlikBitis);
      setTemizlikMesaj("Tarih aralığı doluluk verileri başarıyla temizlendi.");
      setTemizlikBaslangic("");
      setTemizlikBitis("");
      await fetchData();
    } catch (err) {
      setTemizlikHata("Tarih aralığı temizlenirken bir hata oluştu.");
    } finally {
      setTemizlemeYukleniyor(false);
    }
  };

  const handleTemizleTumunu = async () => {
    if (!temizlikVillaId) {
      setTemizlikHata("Lütfen bir villa seçin.");
      return;
    }
    if (!confirm("Seçili villaya ait TÜM doluluk tarihlerini temizlemek istediğinize emin misiniz?")) {
      return;
    }
    try {
      setTemizlemeYukleniyor(true);
      setTemizlikHata("");
      setTemizlikMesaj("");
      await clearAllVillaBookedDates(temizlikVillaId);
      setTemizlikMesaj("Tüm doluluk verileri başarıyla temizlendi.");
      await fetchData();
    } catch (err) {
      setTemizlikHata("Tüm doluluklar temizlenirken bir hata oluştu.");
    } finally {
      setTemizlemeYukleniyor(false);
    }
  };

  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);

  return (
    <MainLayout title="Zaman Çizelgesi">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-neutral-600 dark:text-neutral-450 text-sm">12 Aylık genel doluluk durumunu görüntüleyin. Boş alanlara tıklayarak hızlı rezervasyon oluşturabilirsiniz.</p>
        <button
          type="button"
          onClick={() => setDolulukYonetimiAcik(!dolulukYonetimiAcik)}
          className="px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 flex-shrink-0"
        >
          📅 Doluluk Yönetimi
        </button>
      </div>

      {dolulukYonetimiAcik && (
        <div className="mb-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl p-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-white/5">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Doluluk Tarihleri Yönetimi</h3>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-500 mt-0.5">Belirli tarih aralıklarındaki veya tüm dolulukları temizleyin.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setDolulukYonetimiAcik(false)}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Villa Seçin</label>
              <select
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                value={temizlikVillaId}
                onChange={e => setTemizlikVillaId(e.target.value)}
              >
                <option value="" className="bg-white dark:bg-neutral-900">Villa Seçin</option>
                {villalar.map(villa => (
                  <option key={villa.id} value={villa.id} className="bg-white dark:bg-neutral-900">{villa.ad}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Başlangıç Tarihi</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                value={temizlikBaslangic}
                onChange={e => setTemizlikBaslangic(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">Bitiş Tarihi</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                value={temizlikBitis}
                onChange={e => setTemizlikBitis(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button
              type="button"
              onClick={handleTemizleAralik}
              disabled={temizlemeYukleniyor || !temizlikVillaId || !temizlikBaslangic || !temizlikBitis}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-900 dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {temizlemeYukleniyor ? "Temizleniyor..." : "Tarih Aralığını Temizle"}
            </button>
            <button
              type="button"
              onClick={handleTemizleTumunu}
              disabled={temizlemeYukleniyor || !temizlikVillaId}
              className="px-5 py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {temizlemeYukleniyor ? "Temizleniyor..." : "Tüm Tarihleri Temizle"}
            </button>
          </div>

          {temizlikHata && <p className="text-red-600 dark:text-red-400 text-xs font-bold mt-4">⚠️ {temizlikHata}</p>}
          {temizlikMesaj && <p className="text-primary-600 dark:text-primary-400 text-xs font-bold mt-4">✓ {temizlikMesaj}</p>}
        </div>
      )}

      {loading ? (
        <div className="card-base p-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-primary-500 animate-spin mb-4"></div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Zaman Çizelgesi yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-5 px-5 py-3.5 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 rounded-2xl text-[10px] uppercase font-bold tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-primary-500 dark:bg-primary-600 border border-primary-400 dark:border-primary-500 inline-block shadow-sm"></span>
              <span className="text-neutral-700 dark:text-neutral-300">Web Sitesi (Onaylı)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-primary-50 dark:bg-primary-500/15 border border-primary-400 dark:border-primary-500/35 inline-block shadow-sm"></span>
              <span className="text-neutral-500 dark:text-neutral-400">Web Sitesi (Onay Bekliyor)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-neutral-200 dark:bg-neutral-100 border border-neutral-300 dark:border-white/20 inline-block shadow-sm"></span>
              <span className="text-neutral-700 dark:text-neutral-300">Admin Girişi (Onaylı)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/5 inline-block shadow-sm"></span>
              <span className="text-neutral-500 dark:text-neutral-400">Admin Girişi (Beklemede)</span>
            </div>
          </div>

          <div className="animate-fade-in card-base overflow-hidden border border-neutral-200 dark:border-white/5 flex">
            <div className="w-48 sm:w-64 flex-shrink-0 border-r border-neutral-200 dark:border-white/5 bg-white dark:bg-neutral-900/90 z-20 flex flex-col shadow-xl">
              <div className="h-20 border-b border-neutral-200 dark:border-white/5 flex flex-col justify-end p-4">
                <span className="font-bold text-neutral-900 dark:text-white uppercase text-xs tracking-wider">Villalar</span>
              </div>
              {villalar.map(villa => (
                <div key={villa.id} className="h-16 border-b border-neutral-200 dark:border-white/5 flex items-center px-4">
                  <span className="text-neutral-900 dark:text-white text-sm font-semibold truncate">{villa.ad}</span>
                </div>
              ))}
            </div>

            <div className="flex-grow overflow-x-auto relative scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent" ref={scrollRef}>
              <div className="flex h-10 w-max border-b border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-neutral-950/40 sticky top-0 z-10">
                {months.map((m, idx) => (
                  <div 
                    key={idx} 
                    style={{ width: m.daysCount * DAY_WIDTH }} 
                    className="flex items-center justify-center border-r border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider"
                  >
                    {m.name} {m.year}
                  </div>
                ))}
              </div>
              
              <div className="flex h-10 w-max border-b border-neutral-200 dark:border-white/5 bg-white dark:bg-neutral-900/60 sticky top-10 z-10">
                {daysArray.map((d, i) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div 
                      key={i} 
                      style={{ width: DAY_WIDTH }} 
                      className={`flex items-center justify-center border-r border-neutral-200 dark:border-white/5 text-xs 
                        ${isToday ? "bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-extrabold" : isWeekend ? "bg-neutral-50 dark:bg-neutral-950/20 text-neutral-600 dark:text-neutral-500 font-bold" : "text-neutral-600 dark:text-neutral-500 font-medium"}`}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="w-max relative bg-neutral-50 dark:bg-neutral-950/10">
                {villalar.map(villa => {
                  const villaReservations = getVillaReservations(villa.id);
                  const occupiedSet = buildOccupiedSet(villa, villaReservations);
                  
                  return (
                    <div key={villa.id} className="h-16 flex border-b border-neutral-200 dark:border-white/5 relative group">
                      {daysArray.map((d, i) => {
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const dateAtMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                        const isPast = dateAtMidnight < todayAtMidnight.getTime();
                        const isOccupied = occupiedSet.has(dateAtMidnight);
                        const fiyat = getFiyatForDate(villa, d);

                        return (
                          <div 
                            key={i} 
                            style={{ width: DAY_WIDTH }} 
                            className={`h-full flex items-center justify-center border-r border-neutral-200 dark:border-white/5 transition-colors 
                              ${isPast ? "bg-neutral-50 dark:bg-neutral-950/40 cursor-not-allowed opacity-30" : 
                                isOccupied ? "bg-primary-50 dark:bg-primary-500/5 cursor-not-allowed" :
                                isWeekend ? "cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-500/10 bg-neutral-50 dark:bg-neutral-950/10" : 
                                "cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-500/10"}`}
                            onClick={() => !isPast && !isOccupied && handleDayClick(villa.id, d)}
                            title={`${d.toLocaleDateString("tr-TR")} - ${villa.ad}`}
                          >
                            {!isPast && !isOccupied && fiyat > 0 && (
                              <span className="text-[9px] text-neutral-600 dark:text-neutral-500 font-bold tracking-tight font-mono text-center leading-tight">
                                {fiyat} <br/> ₺
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {villaReservations.map((res, i) => {
                        if (res.startIdx + res.duration <= 0 || res.startIdx >= 365) return null;
                        
                        const actualStart = Math.max(0, res.startIdx);
                        const actualEnd = Math.min(365, res.startIdx + res.duration);
                        const actualWidth = (actualEnd - actualStart) * DAY_WIDTH;
                        
                        const isFromAdmin = res.source === "admin" || (!res.source && !res.totalPrice && !res.guests);
                        const isPending = res.status === "pending" || res.status === "pending_approval";
                        
                        let barColorClass = "";
                        if (isFromAdmin) {
                          barColorClass = isPending 
                            ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300" 
                            : "bg-neutral-200 dark:bg-neutral-100 border-neutral-300 dark:border-white/20 text-slate-900 dark:text-slate-950";
                        } else {
                          barColorClass = isPending 
                            ? "bg-primary-50 dark:bg-primary-500/15 border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400" 
                            : "bg-primary-500 dark:bg-primary-600 border-primary-400 dark:border-primary-500 text-slate-900 dark:text-slate-950 font-bold shadow-md";
                        }

                        return (
                          <div
                            key={`${res.id}-${i}`}
                            className={`absolute top-2.5 bottom-2.5 rounded-xl shadow flex items-center px-3 cursor-pointer z-10 hover:opacity-90 transition-opacity border text-[10px] uppercase font-bold tracking-wide ${barColorClass}`}
                            style={{ 
                              left: actualStart * DAY_WIDTH + 2, 
                              width: actualWidth - 4 
                              }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reservations/${res.id}`);
                            }}
                            title={`${res.fullName} | ${new Date(res.startDate?.toDate ? res.startDate.toDate() : res.startDate).toLocaleDateString("tr-TR")} - ${new Date(res.endDate?.toDate ? res.endDate.toDate() : res.endDate).toLocaleDateString("tr-TR")}`}
                          >
                            <span className="truncate w-full">
                              {res.fullName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalAcik && (
        <QuickReservationModal 
          kapat={() => setModalAcik(false)}
          seciliTarih={seciliTarih}
          seciliVillaId={seciliVillaId}
          villalar={villalar}
          rezervasyonEklendi={handleRezervasyonEklendi}
        />
      )}
    </MainLayout>
  );
}
