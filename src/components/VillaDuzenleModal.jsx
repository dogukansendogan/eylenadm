import React, { useState } from "react";
import { createPortal } from "react-dom";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../services/firebase";
import PricingMatrix from "./PricingMatrix";
const AVAILABLE_AMENITIES = [
  { id: "private_pool", label: "Özel Havuz", icon: "🏊‍♂️" },
  { id: "heated_pool", label: "Isıtmalı Havuz", icon: "🔥" },
  { id: "jacuzzi", label: "Jakuzi / Spa", icon: "🛁" },
  { id: "sauna", label: "Sauna", icon: "🌡️" },
  { id: "sea_view", label: "Deniz Manzaralı", icon: "🌊" },
  { id: "nature_view", label: "Doğa Manzaralı", icon: "🌲" },
  { id: "bbq", label: "Barbekü / Mangal", icon: "🍖" },
  { id: "wifi", label: "Ücretsiz Wi-Fi", icon: "📶" },
  { id: "ac", label: "Klima", icon: "❄️" },
  { id: "fireplace", label: "Şömine", icon: "🔥" },
  { id: "parking", label: "Özel Otopark", icon: "🅿️" },
  { id: "pet_friendly", label: "Evcil Hayvan Dostu", icon: "🐾" },
  { id: "playground", label: "Çocuk Oyun Alanı", icon: "🛝" },
  { id: "security", label: "7/24 Güvenlik / Kamera", icon: "🛡️" }
];

function extractIframeSrc(input) {
  if (!input) return "";
  const match = input.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : input;
}

export default function VillaDuzenleModal({ villa, kapat, villaGuncellendi }) {
  const [formVeri, setFormVeri] = useState({
    ad: villa.ad || "",
    aciklama: villa.aciklama || "",
    fiyat: villa.fiyat || "",
    konum: villa.konum || "",
    il: villa.il || (villa.konum ? villa.konum.split(',')[1]?.trim() : "") || "",
    ilce: villa.ilce || (villa.konum ? villa.konum.split(',')[0]?.trim() : "") || "",
    kapasite: villa.kapasite || "",
    belgeNo: villa.belgeNo || "",
    mapsLinki: villa.mapsLinki || "",
    denizeUzaklik: villa.denizeUzaklik || "",
    balconyCount: villa.balconyCount || "",
    roomCount: villa.roomCount || "",
    showerCount: villa.showerCount || "",
    toiletCount: villa.toiletCount || "",
    mapEmbedUrl: villa.mapEmbedUrl || "",
    amenities: villa.amenities || [],
    seasonalPrices: villa.seasonalPrices || {
      january: "",
      february: "",
      march: "",
      april: "",
      may: "",
      june: "",
      july: "",
      august: "",
      september: "",
      october: "",
      november: "",
      december: ""
    },
    specialDailyPrices: villa.specialDailyPrices || {}
  });
  const [mevcutGorseller, setMevcutGorseller] = useState(villa.gorseller || []);
  const [yeniDosyalar, setYeniDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  // Form verilerini güncelle
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormVeri(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.startsWith("seasonalPrices.")) {
      const ayAdi = name.split('.')[1];
      setFormVeri(prev => ({
        ...prev,
        seasonalPrices: {
          ...prev.seasonalPrices,
          [ayAdi]: value === "" ? "" : parseInt(value) || 0
        }
      }));
    } else {
      const numFields = ["fiyat", "kapasite", "balconyCount", "roomCount", "showerCount", "toiletCount"];
      setFormVeri(prev => ({
        ...prev,
        [name]: numFields.includes(name) ? parseInt(value) || "" : value
      }));
    }
  }

  // Mevcut görseli kaldır
  function gorselKaldir(index) {
    setMevcutGorseller(prev => prev.filter((_, i) => i !== index));
  }

  // Yeni dosya seçimi
  function handleDosyaSec(e) {
    if (e.target.files.length > 0) {
      setYeniDosyalar(Array.from(e.target.files));
    }
  }

  // Formu gönder
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Temel doğrulama
    const eksikAlanlar = [];
    if (!formVeri.ad) eksikAlanlar.push("Villa Adı");
    if (!formVeri.aciklama) eksikAlanlar.push("Açıklama");
    if (!formVeri.il) eksikAlanlar.push("İl");
    if (!formVeri.ilce) eksikAlanlar.push("İlçe");
    if (!formVeri.kapasite) eksikAlanlar.push("Kapasite");

    if (eksikAlanlar.length > 0) {
      setHata(`Lütfen eksik alanları doldurun: ${eksikAlanlar.join(", ")}`);
      return;
    }
    
    if (mevcutGorseller.length === 0 && yeniDosyalar.length === 0) {
      setHata("Lütfen en az bir görsel ekleyin.");
      return;
    }
    
    try {
      setYukleniyor(true);
      setHata("");
      
      let guncelGorseller = [...mevcutGorseller];
      
      // Yeni görseller varsa yükle
      if (yeniDosyalar.length > 0) {
        const yeniGorselURLleri = await Promise.all(
          yeniDosyalar.map(async (dosya) => {
            const dosyaRef = ref(storage, `villa-gorselleri/${Date.now()}_${dosya.name}`);
            const yukleme = await uploadBytes(dosyaRef, dosya);
            return getDownloadURL(yukleme.ref);
          })
        );
        
        guncelGorseller = [...mevcutGorseller, ...yeniGorselURLleri];
      }
      
      // Günlük özel fiyatlardan en düşük fiyatı bul
      let computedFiyat = 0;
      if (formVeri.specialDailyPrices && Object.keys(formVeri.specialDailyPrices).length > 0) {
        const prices = Object.values(formVeri.specialDailyPrices).filter(p => typeof p === 'number' && p > 0);
        if (prices.length > 0) {
          computedFiyat = Math.min(...prices);
        }
      }
      
      // Güncellenecek veriyi hazırla
      const guncelVeri = {
        ...formVeri,
        konum: (formVeri.ilce && formVeri.il) ? `${formVeri.ilce}, ${formVeri.il}` : formVeri.konum,
        gorseller: guncelGorseller,
        // Sayısal değerleri dönüştür
        fiyat: computedFiyat,
        kapasite: Number(formVeri.kapasite),
        balconyCount: Number(formVeri.balconyCount) || 0,
        roomCount: Number(formVeri.roomCount) || 0,
        showerCount: Number(formVeri.showerCount) || 0,
        toiletCount: Number(formVeri.toiletCount) || 0,
        mapEmbedUrl: extractIframeSrc(formVeri.mapEmbedUrl),
        specialDailyPrices: formVeri.specialDailyPrices || {},
        guncellenmeTarihi: new Date()
      };
      delete guncelVeri.fiyatlar;
      
      const villaRef = doc(db, "villalar", villa.id);
      await updateDoc(villaRef, guncelVeri);
      
      // Güncellenmiş villa bilgilerini ana sayfaya gönder
      villaGuncellendi({
        id: villa.id,
        ...guncelVeri
      });
      
      kapat();
    } catch (err) {

      setHata("Villa güncellenirken bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 dark:bg-black/75 flex justify-center items-end sm:items-center sm:p-4 z-[9999] backdrop-blur-sm sm:pt-4 pt-12 pb-safe">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in">
        <div className="bg-neutral-50 dark:bg-neutral-950/40 border-b border-neutral-200 dark:border-white/5 px-6 py-4 text-neutral-900 dark:text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Villa Düzenle: {formVeri.ad}</h2>
            <button
              onClick={kapat}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-full p-2 transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {hata && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {hata}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label htmlFor="ad" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Villa Adı
                </label>
                <input
                  type="text"
                  id="ad"
                  name="ad"
                  value={formVeri.ad}
                  onChange={handleChange}
                  placeholder="Villa adını girin"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>
              
              <div className="col-span-full">
                <label htmlFor="belgeNo" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  T.C. Kültür ve Turizm Bakanlığı Belge Numarası
                </label>
                <input
                  type="text"
                  id="belgeNo"
                  name="belgeNo"
                  value={formVeri.belgeNo}
                  onChange={handleChange}
                  placeholder="Örnek: 48-2687"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label htmlFor="kapasite" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Kapasite (Kişi Sayısı)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="kapasite"
                    name="kapasite"
                    value={formVeri.kapasite}
                    onChange={handleChange}
                    placeholder="4"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                    required
                    min="1"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="denizeUzaklik" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Denize Uzaklık
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    id="denizeUzaklik"
                    name="denizeUzaklik"
                    value={formVeri.denizeUzaklik ? formVeri.denizeUzaklik.toString().replace(/ km/gi, '').trim() : ''}
                    onChange={(e) => setFormVeri(prev => ({ ...prev, denizeUzaklik: e.target.value ? `${e.target.value} km` : '' }))}
                    placeholder="2.5"
                    className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">km</span>
                  </div>
                </div>
              </div>
              
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="il" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                      İl <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="il"
                        name="il"
                        value={formVeri.il || ''}
                        onChange={handleChange}
                        placeholder="Örn: Muğla"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ilce" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                      İlçe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="ilce"
                        name="ilce"
                        value={formVeri.ilce || ''}
                        onChange={handleChange}
                        placeholder="Örn: Bodrum"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              
              <div className="col-span-full">
                <label htmlFor="aciklama" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Açıklama
                </label>
                <textarea
                  id="aciklama"
                  name="aciklama"
                  rows="4"
                  value={formVeri.aciklama}
                  onChange={handleChange}
                  placeholder="Villa hakkında detaylı bilgi verin..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                ></textarea>
              </div>



              <div className="col-span-full border-t border-neutral-200 dark:border-white/5 pt-6 mt-2">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">Detaylı Teknik Özellikler</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="roomCount" className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Oda Sayısı
                    </label>
                    <input
                      type="number"
                      id="roomCount"
                      name="roomCount"
                      value={formVeri.roomCount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="balconyCount" className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Balkon Sayısı
                    </label>
                    <input
                      type="number"
                      id="balconyCount"
                      name="balconyCount"
                      value={formVeri.balconyCount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="showerCount" className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Duş Sayısı
                    </label>
                    <input
                      type="number"
                      id="showerCount"
                      name="showerCount"
                      value={formVeri.showerCount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="toiletCount" className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                      Lavabo Sayısı
                    </label>
                    <input
                      type="number"
                      id="toiletCount"
                      name="toiletCount"
                      value={formVeri.toiletCount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-full border-t border-neutral-200 dark:border-white/5 pt-6 mt-2">
                <label htmlFor="mapEmbedUrl" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Harita Embed Kodu / URL
                </label>
                <textarea
                  id="mapEmbedUrl"
                  name="mapEmbedUrl"
                  rows="3"
                  value={formVeri.mapEmbedUrl}
                  onChange={handleChange}
                  placeholder="iframe gömme kodunu veya doğrudan Google Maps harita linkini buraya yapıştırın"
                  className="w-full px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-xs"
                ></textarea>
              </div>
            </div>

            <div className="border-b border-neutral-200 dark:border-white/5 pb-6 my-6">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">Villa Özellikleri</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Villanın sahip olduğu lüks ve konsept özellikleri seçin.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isChecked = (formVeri.amenities || []).includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => {
                        const currentAmenities = formVeri.amenities || [];
                        const newAmenities = isChecked
                          ? currentAmenities.filter(id => id !== amenity.id)
                          : [...currentAmenities, amenity.id];
                        setFormVeri(prev => ({
                          ...prev,
                          amenities: newAmenities
                        }));
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                        isChecked
                          ? "border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-200 shadow-sm"
                          : "border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-neutral-950/50 hover:bg-neutral-100 dark:hover:bg-neutral-950 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <span className="text-xl select-none">{amenity.icon}</span>
                      <span className="text-xs font-semibold">{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <PricingMatrix formVeri={formVeri} setFormVeri={setFormVeri} />
            
            <div className="bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200 dark:border-white/5 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2 flex items-center">
                <svg className="w-5 h-5 mr-1 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mevcut Görseller {mevcutGorseller.length > 0 && `(${mevcutGorseller.length})`}
              </h3>
              
              {mevcutGorseller.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                  {mevcutGorseller.map((gorsel, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden shadow-md">
                      <img 
                        src={gorsel} 
                        alt={`Görsel ${index + 1}`} 
                        className="h-24 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => gorselKaldir(index)}
                          className="bg-red-600 hover:bg-red-500 text-white rounded-full p-2 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 bg-neutral-100 dark:bg-neutral-950 rounded-xl text-neutral-500 dark:text-neutral-400">
                  <p className="text-xs">Mevcut görsel bulunmamaktadır</p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Yeni Görseller Ekle
              </label>
              <div className="border-2 border-dashed border-neutral-300 dark:border-white/5 bg-neutral-50 dark:bg-neutral-950/20 rounded-xl p-6 text-center hover:border-primary-500/40 transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={handleDosyaSec}
                  className="hidden"
                  accept="image/*"
                  multiple
                  id="villa-yeni-gorseller"
                />
                <label htmlFor="villa-yeni-gorseller" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-primary-600 dark:text-primary-400">Dosya seçmek için tıklayın</span> veya dosyaları sürükleyin
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-600">
                    PNG, JPG, GIF - Maksimum dosya boyutu: 5MB
                  </p>
                </label>
              </div>
            </div>
            
            {yeniDosyalar.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-3">Yeni Görsel Önizlemeleri ({yeniDosyalar.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {yeniDosyalar.map((dosya, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden shadow-md">
                      <img 
                        src={URL.createObjectURL(dosya)} 
                        alt={`Yeni Görsel ${index + 1}`} 
                        className="h-24 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-white/5">
              <button
                type="button"
                onClick={kapat}
                className="px-4 py-2.5 bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-semibold transition-all"
                disabled={yukleniyor}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={yukleniyor}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center"
              >
                {yukleniyor ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Villayı Güncelle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
} 