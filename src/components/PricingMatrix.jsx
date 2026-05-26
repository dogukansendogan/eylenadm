import React, { useState, useMemo, useEffect } from 'react';

export default function PricingMatrix({ formVeri, setFormVeri }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [specialStartDate, setSpecialStartDate] = useState("");
  const [specialEndDate, setSpecialEndDate] = useState("");
  const [specialPrice, setSpecialPrice] = useState("");
  const [hata, setHata] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sürükle-seç ve çoklu gün seçimi state'leri
  const [selectedDates, setSelectedDates] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);

  const monthKeys = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const monthNamesTr = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // ESC tuşu ile tam ekrandan çıkma
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global mouseup ile seçimi bitirme
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Seçili tarihler değiştikçe inputları otomatik güncelle
  useEffect(() => {
    if (selectedDates.length > 0) {
      const sorted = [...selectedDates].sort((a, b) => new Date(a) - new Date(b));
      setSpecialStartDate(sorted[0]);
      setSpecialEndDate(sorted[sorted.length - 1]);
    } else {
      setSpecialStartDate("");
      setSpecialEndDate("");
    }
  }, [selectedDates]);

  // Helper: İki tarih arasındaki tüm günleri bulma
  const getDatesBetween = (startDateStr, endDateStr) => {
    const dates = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const current = new Date(Math.min(start, end));
    const last = new Date(Math.max(start, end));
    
    while (current <= last) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Helper: Grup hesaplama
  const groupedSpecialPrices = useMemo(() => {
    const specialDailyPrices = formVeri.specialDailyPrices || {};
    if (Object.keys(specialDailyPrices).length === 0) return [];
    
    const dates = Object.keys(specialDailyPrices).sort((a, b) => new Date(a) - new Date(b));
    const groups = [];
    let currentGroup = null;

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const price = specialDailyPrices[dateStr];
      const currDate = new Date(dateStr);
      
      if (!currentGroup) {
        currentGroup = { start: dateStr, end: dateStr, price, dates: [dateStr] };
      } else {
        const prevDate = new Date(currentGroup.end);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1 && currentGroup.price === price) {
          currentGroup.end = dateStr;
          currentGroup.dates.push(dateStr);
        } else {
          groups.push(currentGroup);
          currentGroup = { start: dateStr, end: dateStr, price, dates: [dateStr] };
        }
      }
    }
    
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  }, [formVeri.specialDailyPrices]);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = new Date(year, month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1; // Pzt: 0, Paz: 6

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getPriceForDate = (dayNum) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    if (formVeri.specialDailyPrices && formVeri.specialDailyPrices[dStr]) {
      return { price: formVeri.specialDailyPrices[dStr], isSpecial: true, dateStr: dStr };
    }
    
    return { price: 0, isSpecial: false, dateStr: dStr };
  };

  // Mouse Drag Handlers
  const handleMouseDown = (dateStr) => {
    setIsSelecting(true);
    setSelectionStart(dateStr);
    setSelectedDates([dateStr]);
  };

  const handleMouseEnter = (dateStr) => {
    if (!isSelecting || !selectionStart) return;
    const dates = getDatesBetween(selectionStart, dateStr);
    setSelectedDates(dates);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Hızlı Seçim Kısayolları
  const selectAllWeekends = () => {
    const dates = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dayOfWeek = d.getDay(); // 0: Paz, 5: Cum, 6: Cmt
      // Cuma (5) veya Cumartesi (6) ise ekle
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${dayStr}`);
      }
    }
    setSelectedDates(dates);
  };

  const selectAllMonth = () => {
    const dates = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${dayStr}`);
    }
    setSelectedDates(dates);
  };

  const clearSelection = () => {
    setSelectedDates([]);
  };

  const handleAddSpecialPrice = () => {
    if (selectedDates.length === 0) {
      setHata("Lütfen takvim üzerinden sürükleyerek veya kısayolları kullanarak gün seçin.");
      return;
    }

    const newPrices = { ...(formVeri.specialDailyPrices || {}) };

    if (specialPrice === "" || specialPrice === undefined || specialPrice === null) {
      // Fiyat yazılmadıysa, seçilen günlerin özel fiyatlarını silerek o ayın fiyatına dönmesini sağla
      selectedDates.forEach(dStr => {
        delete newPrices[dStr];
      });
    } else {
      // Fiyat yazıldıysa, seçilen günlere o fiyatı tanımla
      const priceVal = Number(specialPrice);
      selectedDates.forEach(dStr => {
        newPrices[dStr] = priceVal;
      });
    }

    setFormVeri(prev => ({ ...prev, specialDailyPrices: newPrices }));
    setSelectedDates([]);
    setSpecialPrice("");
    setHata("");
  };

  const handleRemoveGroup = (group) => {
    setFormVeri(prev => {
      const updated = { ...prev.specialDailyPrices };
      group.dates.forEach(d => delete updated[d]);
      return { ...prev, specialDailyPrices: updated };
    });
  };

  const formatDateTr = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[100] bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8" : "mt-6 mb-8"}>
      <div className={`border border-neutral-200 dark:border-white/5 rounded-2xl shadow-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300
        ${isFullscreen ? "w-full max-w-7xl h-[90vh]" : "w-full"}`}>
        
        <div className="bg-neutral-50/40 dark:bg-neutral-950/40 px-6 py-4 border-b border-neutral-200 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Fiyat Yönetimi ve Önizleme Takvimi
              {isFullscreen && <span className="bg-primary-500/10 text-primary-400 text-xs font-semibold px-2 py-0.5 rounded border border-primary-500/20">Tam Ekran</span>}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
              Tarih seçmek için takvimde sürükleyin veya tıklayın. Seçtiğiniz günlere sağdan toplu fiyat tanımlayabilirsiniz.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              type="button" 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition-colors border border-neutral-200 dark:border-white/5 shadow-sm bg-white dark:bg-neutral-950"
              title={isFullscreen ? "Küçült (ESC)" : "Tam Ekran Yap"}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className={`p-6 overflow-y-auto flex-1 ${isFullscreen ? "flex flex-col lg:flex-row gap-8" : "flex flex-col xl:flex-row gap-8"}`}>
          
          <div className="flex-[1.3] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">İnteraktif Fiyat Önizleme Takvimi</h4>
                  {selectedDates.length > 0 && (
                    <span className="bg-primary-500/10 text-primary-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-primary-500/20 animate-pulse">
                      {selectedDates.length} Gün Seçildi
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors border border-neutral-200 dark:border-white/5 shadow-sm bg-white dark:bg-neutral-950">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="font-bold text-primary-400 min-w-[120px] text-center text-sm">
                    {monthNamesTr[month]} {year}
                  </span>
                  <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors border border-neutral-200 dark:border-white/5 shadow-sm bg-white dark:bg-neutral-950">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 bg-neutral-100/40 dark:bg-neutral-950/40 p-2 rounded-xl border border-neutral-200 dark:border-white/5">
                <button type="button" onClick={selectAllWeekends} className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium hover:border-primary-500/40 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm">
                  📅 Hafta Sonlarını Seç (Cuma-Cmt)
                </button>
                <button type="button" onClick={selectAllMonth} className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium hover:border-primary-500/40 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm">
                  🗓️ Tüm Ayı Seç
                </button>
                {selectedDates.length > 0 && (
                  <button type="button" onClick={clearSelection} className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shadow-sm">
                    ❌ Seçimi Temizle
                  </button>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-neutral-500 dark:text-neutral-500">
                <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 sm:h-20 bg-neutral-100 dark:bg-neutral-950/10 rounded-xl border border-dashed border-neutral-200 dark:border-white/5"></div>
                ))}
                
                {daysArray.map((dayNum) => {
                  const { price, isSpecial, dateStr } = getPriceForDate(dayNum);
                  const isSelected = selectedDates.includes(dateStr);
                  
                  return (
                    <div 
                      key={dayNum}
                      onMouseDown={() => handleMouseDown(dateStr)}
                      onMouseEnter={() => handleMouseEnter(dateStr)}
                      onMouseUp={handleMouseUp}
                      className={`relative h-14 sm:h-20 rounded-xl flex flex-col justify-between p-2 cursor-pointer transition-all duration-200 select-none
                        ${isSelected
                          ? 'bg-primary-600 text-slate-950 shadow-md scale-[1.02] border-2 border-primary-400 z-10 font-bold'
                          : isSpecial 
                            ? 'bg-primary-500/10 border border-primary-500/30 text-primary-600 dark:text-primary-300 hover:bg-primary-500/20' 
                            : 'bg-white dark:bg-neutral-950/40 border border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                        }`}
                    >
                      <span className={`absolute top-1.5 right-2 text-[10px] font-bold ${isSelected ? 'text-slate-950/80' : 'text-neutral-500 dark:text-neutral-500'}`}>
                        {dayNum}
                      </span>
                      
                      <div className="flex-grow flex items-center justify-center pt-2">
                        <span className={`text-xs sm:text-sm font-black tracking-tight ${isSelected ? 'text-slate-950' : isSpecial ? 'text-primary-600 dark:text-primary-300' : 'text-neutral-900 dark:text-white'}`}>
                          {price > 0 ? `${price.toLocaleString('tr-TR')} ₺` : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-500 border-t border-neutral-200 dark:border-white/5 pt-3">
              * Takvim hücresi üzerinde farenizi basılı tutup sürükleyerek toplu tarih seçebilirsiniz.
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>

                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm mb-4">Yeni Özel Fiyat Kuralı</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-950/40 p-4 rounded-xl border border-neutral-200 dark:border-white/5 mb-6">
                    {selectedDates.length > 0 ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-300 rounded-lg p-3 mb-4 text-xs font-semibold flex items-center justify-between">
                        <span>⚡ {selectedDates.length} Gün İçin Çoklu Seçim Aktif</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">({formatDateTr(specialStartDate)} - {formatDateTr(specialEndDate)})</span>
                      </div>
                    ) : (
                      <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/10 text-primary-600 dark:text-primary-300 rounded-lg p-3 mb-4 text-xs">
                        💡 Başlangıç ve bitiş tarihlerini belirlemek için soldaki takvim üzerinden sürükleyerek günleri seçin.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Başlangıç</label>
                        <input type="date" value={specialStartDate} readOnly className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-neutral-950 rounded-lg text-neutral-400 dark:text-neutral-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Bitiş</label>
                        <input type="date" value={specialEndDate} readOnly className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-neutral-950 rounded-lg text-neutral-400 dark:text-neutral-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Gecelik Fiyat (₺)</label>
                        <input type="number" min="1" value={specialPrice} onChange={e => setSpecialPrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-white/5 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSpecialPrice}
                        className={`px-4 py-2 text-xs rounded-lg font-semibold transition-all h-[38px] flex items-center justify-center ${
                          specialPrice 
                            ? "bg-gradient-to-r from-primary-600 to-primary-500 text-slate-950" 
                            : "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/5"
                        }`}
                      >
                        {specialPrice ? "Kuralı Tanımla" : "Kuralları Temizle"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col min-h-[220px]">
                    <h4 className="font-bold text-neutral-900 dark:text-white text-sm mb-3 flex items-center justify-between">
                      <span>Aktif Fiyat Kuralları</span>
                      <span className="bg-primary-500/10 text-primary-400 text-xs py-0.5 px-2.5 rounded-full font-bold border border-primary-500/20">{groupedSpecialPrices.length} Kural</span>
                    </h4>
                    
                    <div className="flex-1 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden bg-white dark:bg-neutral-950/20">
                      <div className="overflow-y-auto max-h-[280px]">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-white/5 text-xs">
                          <thead className="bg-neutral-50 dark:bg-neutral-950/60 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Tarih Aralığı</th>
                              <th className="px-4 py-3 text-left font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Fiyat</th>
                              <th className="px-4 py-3 text-right font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {groupedSpecialPrices.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-500">
                                  Henüz özel bir fiyat kuralı eklenmemiş.
                                </td>
                              </tr>
                            ) : (
                              groupedSpecialPrices.map((group, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-white/[0.01] transition-colors">
                                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap">
                                    {formatDateTr(group.start)} {group.start !== group.end ? `- ${formatDateTr(group.end)}` : ''}
                                  </td>
                                  <td className="px-4 py-3 font-extrabold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                                    {group.price.toLocaleString('tr-TR')} ₺
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <button type="button" onClick={() => handleRemoveGroup(group)} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Sil">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
