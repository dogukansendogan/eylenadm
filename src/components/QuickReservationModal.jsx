import React, { useState } from "react";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";

export default function QuickReservationModal({ 
  kapat, 
  seciliTarih, 
  seciliVillaId, 
  villalar,
  rezervasyonEklendi 
}) {
  const [formVeri, setFormVeri] = useState({
    villaId: seciliVillaId || (villalar.length > 0 ? villalar[0].id : ""),
    startDate: seciliTarih || "",
    endDate: "",
    fullName: "",
    email: "",
    phone: "",
    status: "approved"
  });
  
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormVeri(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formVeri.villaId || !formVeri.startDate || !formVeri.endDate || !formVeri.fullName || !formVeri.phone) {
      setHata("Lütfen zorunlu alanları doldurun.");
      return;
    }

    if (new Date(formVeri.endDate) <= new Date(formVeri.startDate)) {
      setHata("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
      return;
    }

    try {
      setYukleniyor(true);
      setHata("");
      
      const seciliVilla = villalar.find(v => v.id === formVeri.villaId);
      
      const rezervasyonVerisi = {
        villaId: formVeri.villaId,
        villaName: seciliVilla ? seciliVilla.ad : "",
        startDate: Timestamp.fromDate(new Date(formVeri.startDate)),
        endDate: Timestamp.fromDate(new Date(formVeri.endDate)),
        fullName: formVeri.fullName,
        email: formVeri.email,
        phone: formVeri.phone,
        status: formVeri.status,
        source: "admin",
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "reservations"), rezervasyonVerisi);
      
      rezervasyonEklendi({
        id: docRef.id,
        ...rezervasyonVerisi,
        // Mock createdAt for UI update
        createdAt: Timestamp.fromDate(new Date()) 
      });
      
      kapat();
    } catch (err) {

      setHata("Rezervasyon eklenirken bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex justify-center items-end sm:items-center sm:p-4 z-[60] backdrop-blur-sm sm:pt-4 pt-10 pb-safe">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in">
        <div className="bg-neutral-50 dark:bg-neutral-950/40 border-b border-neutral-200 dark:border-white/5 px-6 py-4 text-neutral-900 dark:text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Hızlı Rezervasyon</h2>
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
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {hata}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Villa <span className="text-red-500">*</span>
              </label>
              <select
                name="villaId"
                value={formVeri.villaId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                required
              >
                <option value="" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Villa Seçin</option>
                {villalar.map(villa => (
                  <option key={villa.id} value={villa.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">{villa.ad}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Giriş Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formVeri.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Çıkış Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formVeri.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Müşteri Adı Soyadı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formVeri.fullName}
                onChange={handleChange}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formVeri.phone}
                  onChange={handleChange}
                  placeholder="05..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  value={formVeri.email}
                  onChange={handleChange}
                  placeholder="ornek@mail.com"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Durum
              </label>
              <select
                name="status"
                value={formVeri.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
              >
                <option value="approved" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Onaylandı</option>
                <option value="pending" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Beklemede</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-white/5 mt-6">
              <button
                type="button"
                onClick={kapat}
                className="px-4 py-2.5 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-800 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-semibold transition-all"
                disabled={yukleniyor}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={yukleniyor}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center"
              >
                {yukleniyor ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  "Rezervasyonu Kaydet"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
