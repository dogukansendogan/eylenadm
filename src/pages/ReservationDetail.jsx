import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import MainLayout from "../components/MainLayout";
import { adminUpdateReservation } from "../services/admin-reservationService";

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [villas, setVillas] = useState([]);
  const [selectedVilla, setSelectedVilla] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const reservationDoc = await getDoc(doc(db, "reservations", id));
        if (reservationDoc.exists()) {
          const reservationData = {
            id: reservationDoc.id,
            ...reservationDoc.data()
          };
          setReservation(reservationData);
          if (reservationData.startDate && reservationData.endDate) {
            const startDateObj = reservationData.startDate.toDate();
            const endDateObj = reservationData.endDate.toDate();
            setStartDate(formatDateForInput(startDateObj));
            setEndDate(formatDateForInput(endDateObj));
          }
          if (reservationData.villaId) {
            setSelectedVilla(reservationData.villaId);
          }
        } else {
          setError("Rezervasyon bulunamadı");
        }
        const villasSnapshot = await getDocs(collection(db, "villalar"));
        const villasList = villasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVillas(villasList);
        setLoading(false);
      } catch (err) {
        setError("Veriler yüklenirken bir hata oluştu");
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function formatDateForInput(date) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateString) {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  }

  async function updateReservation(newStatus) {
    if (!selectedVilla) {
      setError("Lütfen bir villa seçin");
      return;
    }
    if (!startDate || !endDate) {
      setError("Lütfen başlangıç ve bitiş tarihlerini seçin");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError("Bitiş tarihi başlangıç tarihinden sonra olmalıdır");
      return;
    }
    try {
      setUpdating(true);
      setError("");
      const updateData = {
        villaId: selectedVilla,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: newStatus,
        updatedAt: new Date()
      };
      const selectedVillaData = villas.find(villa => villa.id === selectedVilla);
      if (selectedVillaData) {
        updateData.villaName = selectedVillaData.ad;
      }
      await adminUpdateReservation(id, updateData, true);
      alert("Rezervasyon başarıyla güncellendi");
      navigate("/reservations");
    } catch (err) {
      setError("Rezervasyon güncellenirken bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  }

  function handleVillaChange(e) {
    setSelectedVilla(e.target.value);
  }

  if (loading) {
    return (
      <MainLayout title="Rezervasyon Detayı">
        <div className="card-base p-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-primary-500 dark:border-t-primary-500 animate-spin mb-4"></div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-semibold">Yükleniyor...</p>
        </div>
      </MainLayout>
    );
  }

  if (error && !reservation) {
    return (
      <MainLayout title="Rezervasyon Detayı">
        <div className="card-base p-8 text-center flex flex-col items-center justify-center gap-4">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider">{error}</h2>
          <button
            onClick={() => navigate("/reservations")}
            className="px-4 py-2 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            Rezervasyon Listesine Dön
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Rezervasyon Detayı">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
          Rezervasyon No: <span className="font-mono text-neutral-900 dark:text-white text-sm ml-1">#{id.substring(0, 8).toUpperCase()}</span>
        </div>
        <button
          onClick={() => navigate("/reservations")}
          className="px-4 py-2 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Listeye Dön
        </button>
      </div>
      
      <div className="card-base overflow-hidden">
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950/40 border-b border-neutral-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {reservation?.status === "approved" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : reservation?.status === "rejected" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Rezervasyon Durumu: {
                reservation?.status === "approved" ? "Onaylandı" :
                reservation?.status === "rejected" ? "Reddedildi" :
                reservation?.status === "pending_approval" ? "Ödeme Onayı Bekliyor" :
                "Beklemede"
              }
            </h2>
          </div>
          <div>
            {reservation?.status === "approved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></span>
                Onaylandı
              </span>
            )}
            {reservation?.status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Reddedildi
              </span>
            )}
            {reservation?.status !== "approved" && reservation?.status !== "rejected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-500/25">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500"></span>
                </span>
                Beklemede
              </span>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mx-6 mt-6 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}
          
        <div className="p-6 border-b border-neutral-200 dark:border-white/5">
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Müşteri Bilgileri
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">İsim Soyisim</div>
              <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{reservation?.fullName || "-"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">E-posta</div>
              <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{reservation?.email || "-"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Telefon</div>
              <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{reservation?.phone || "-"}</div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Rezervasyon Bilgileri
          </h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="villa" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Villa Seçimi
              </label>
              <select
                id="villa"
                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                value={selectedVilla}
                onChange={handleVillaChange}
                disabled={updating}
              >
                <option value="" className="bg-white dark:bg-neutral-900">Villa Seçin</option>
                {villas.map(villa => (
                  <option key={villa.id} value={villa.id} className="bg-white dark:bg-neutral-900">
                    {villa.ad}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={updating}
                />
                <div className="mt-1 text-[10px] text-neutral-500 font-medium">
                  Görünen Tarih: {formatDateForDisplay(startDate)}
                </div>
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={updating}
                />
                <div className="mt-1 text-[10px] text-neutral-500 font-medium">
                  Görünen Tarih: {formatDateForDisplay(endDate)}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Müşteri Notu
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-white/5 rounded-xl p-4 text-neutral-900 dark:text-white text-sm leading-relaxed">
                {reservation?.note || "Müşteri notu bulunmamaktadır."}
              </div>
            </div>

            {(reservation?.receiptUrl || reservation?.dekontUrl || reservation?.paymentReceiptUrl || reservation?.paymentReceipt) && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  Ödeme Dekontu
                </div>
                <div>
                  <a
                    href={reservation.receiptUrl || reservation.dekontUrl || reservation.paymentReceiptUrl || reservation.paymentReceipt}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/25 hover:border-primary-300 dark:hover:border-primary-500/40 text-primary-700 dark:text-primary-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    📄 Dekontu Yeni Sekmede Aç
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4 border-t border-neutral-200 dark:border-white/5 pt-6">
            <button
              type="button"
              onClick={() => updateReservation("approved")}
              disabled={updating || reservation?.status === "approved"}
              className={`px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center ${
                updating || reservation?.status === "approved" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {updating ? "İşleniyor..." : reservation?.status === "approved" ? "Onaylandı" : "Rezervasyonu Onayla"}
            </button>
            
            <button
              type="button"
              onClick={() => updateReservation("rejected")}
              disabled={updating || reservation?.status === "rejected"}
              className={`px-5 py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center ${
                updating || reservation?.status === "rejected" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {updating ? "İşleniyor..." : reservation?.status === "rejected" ? "Reddedildi" : "Rezervasyonu Reddet"}
            </button>
            
            <button
              type="button"
              onClick={() => updateReservation("pending")}
              disabled={updating || reservation?.status === "pending"}
              className={`px-5 py-2.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center ${
                updating || reservation?.status === "pending" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {updating ? "İşleniyor..." : "Beklemeye Al"}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}