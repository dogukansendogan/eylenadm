import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import VillaEkleModal from "../components/VillaEkleModal";
import VillaDuzenleModal from "../components/VillaDuzenleModal";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";

export default function Villalar() {
  const [villalar, setVillalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ekleModalAcik, setEkleModalAcik] = useState(false);
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [seciliVilla, setSeciliVilla] = useState(null);
  const navigate = useNavigate();
  const villas = villalar;

  useEffect(() => {
    async function villalariGetir() {
      try {
        setLoading(true);
        const villalarRef = collection(db, "villalar");
        const snapshot = await getDocs(villalarRef);
        const villalarListesi = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVillalar(villalarListesi);
        setError("");
      } catch (err) {
        setError("Villalar yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }
    villalariGetir();
  }, []);

  async function villaSil(id) {
    const onay = window.confirm("Bu villayı silmek istediğinize emin misiniz?");
    if (onay) {
      try {
        await deleteDoc(doc(db, "villalar", id));
        setVillalar(prev => prev.filter(villa => villa.id !== id));
      } catch (err) {
        alert("Villa silinirken bir hata oluştu.");
      }
    }
  }

  function villaDuzenle(villa) {
    setSeciliVilla(villa);
    setDuzenleModalAcik(true);
  }

  function villaEklendi(yeniVilla) {
    setVillalar(prev => [...prev, yeniVilla]);
    setEkleModalAcik(false);
  }

  function villaGuncellendi(guncelVilla) {
    setVillalar(prev =>
      prev.map(villa =>
        villa.id === guncelVilla.id ? guncelVilla : villa
      )
    );
    setDuzenleModalAcik(false);
    setSeciliVilla(null);
  }

  return (
    <MainLayout title="Villa Yönetimi">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sistemdeki tüm villaları listeyebilir, güncelleyebilir veya silebilirsiniz.</p>
        </div>
        <button
          onClick={() => setEkleModalAcik(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-white dark:text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Villa Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 animate-fade-in">
        <div className="card-base p-6 group hover:border-primary-500/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/15 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">Toplam Villa</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono mt-0.5">{villalar.length}</p>
            </div>
          </div>
        </div>

        <div className="card-base p-6 group hover:border-primary-500/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/15 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">Ortalama Fiyat</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono mt-0.5">
                {villalar.length > 0
                  ? `${Math.round(villalar.reduce((acc, villa) => acc + (villa.fiyat || 0), 0) / villalar.length).toLocaleString('tr-TR')} ₺`
                  : "0 ₺"}
              </p>
            </div>
          </div>
        </div>

        <div className="card-base p-6 group hover:border-primary-500/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/15 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">Farklı Konum</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono mt-0.5">
                {new Set(villalar.map(v => v.konum || "")).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-600 dark:text-red-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 animate-slide-down">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card-base p-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-primary-500 animate-spin mb-4"></div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Villalar yükleniyor...</p>
        </div>
      ) : villalar.length === 0 ? (
        <div className="card-base p-6 border-l-4 border-primary-500">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 flex-shrink-0 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-neutral-900 dark:text-white text-sm">Henüz kayıtlı villa bulunmamaktadır.</p>
              <p className="text-xs mt-0.5 text-neutral-500 dark:text-neutral-400">Yeni villa ekleyerek sisteme kayıt yapmaya başlayabilirsiniz.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {villas?.map((villa) => (
            <div key={villa.id} className="card-base p-5 hover:border-primary-500/20 group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg-glow">
              <div>
                <div className="relative overflow-hidden h-48 rounded-xl bg-neutral-100 dark:bg-neutral-950 mb-4">
                  {villa.gorseller && villa.gorseller.length > 0 ? (
                    <img
                      src={villa.gorseller[0]}
                      alt={villa.ad}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
                      <svg className="w-10 h-10 text-neutral-400 dark:text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/85 dark:bg-neutral-950/85 border border-neutral-200/50 dark:border-primary-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 animate-pulse"></span>
                    {villa.fiyat?.toLocaleString()} ₺/gece
                  </div>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-wide group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {villa.ad}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {villa.aciklama || "Villa hakkında detaylı bilgi bulunmuyor."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-neutral-600 dark:text-neutral-300 my-4 bg-neutral-50 dark:bg-neutral-950/40 p-3 rounded-xl border border-neutral-200 dark:border-white/5">
                  <div className="flex items-center gap-1.5">🛏️ <span className="font-mono font-bold text-neutral-900 dark:text-white">{villa.roomCount || 0}</span> Oda</div>
                  <div className="flex items-center gap-1.5">🌅 <span className="font-mono font-bold text-neutral-900 dark:text-white">{villa.balconyCount || 0}</span> Balkon</div>
                  <div className="flex items-center gap-1.5">🚿 <span className="font-mono font-bold text-neutral-900 dark:text-white">{villa.showerCount || 0}</span> Duş</div>
                  <div className="flex items-center gap-1.5">🚽 <span className="font-mono font-bold text-neutral-900 dark:text-white">{villa.toiletCount || 0}</span> Lavabo</div>
                  <div className="flex items-center gap-1.5 col-span-2 border-t border-neutral-200 dark:border-white/5 pt-1.5 mt-0.5 justify-between">
                    <div className="flex items-center gap-1">👥 <span className="font-mono font-bold text-neutral-900 dark:text-white">{villa.kapasite || 0}</span> Kişi</div>
                    <div className="text-neutral-500 dark:text-neutral-400 uppercase text-[9px] font-bold tracking-wider">{villa.konum || "Belirtilmemiş"}</div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-white/5 pt-4 mt-4 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <span className="block text-[8px] tracking-widest text-neutral-500 dark:text-neutral-400 uppercase font-bold">Deniz</span>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 font-mono mt-0.5 block">{villa.denizeUzaklik || "---"}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[8px] tracking-widest text-neutral-500 dark:text-neutral-400 uppercase font-bold">Belge No</span>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 font-mono mt-0.5 block truncate px-1">{villa.belgeNo || "---"}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[8px] tracking-widest text-neutral-500 dark:text-neutral-400 uppercase font-bold">Kapasite</span>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 font-mono mt-0.5 block">{villa.kapasite ? `${villa.kapasite} Kişi` : "---"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 dark:border-white/5 pt-4 mt-4 flex justify-end gap-3">
                <button
                  onClick={() => villaDuzenle(villa)}
                  className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Düzenle
                </button>
                <button
                  onClick={() => villaSil(villa.id)}
                  className="px-3.5 py-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {ekleModalAcik && (
        <VillaEkleModal
          kapat={() => setEkleModalAcik(false)}
          villaEklendi={villaEklendi}
        />
      )}

      {duzenleModalAcik && seciliVilla && (
        <VillaDuzenleModal
          villa={seciliVilla}
          kapat={() => {
            setDuzenleModalAcik(false);
            setSeciliVilla(null);
          }}
          villaGuncellendi={villaGuncellendi}
        />
      )}
    </MainLayout>
  );
}