import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { adminUpdateReservation } from "../services/admin-reservationService";
import MainLayout from "../components/MainLayout";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    async function loadReservations() {
      try {
        const reservationsQuery = query(
          collection(db, "reservations"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(reservationsQuery);
        const reservationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReservations(reservationsList);
        setLoading(false);
      } catch (err) {
        setError("Rezervasyonlar yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    }
    loadReservations();
  }, []);

  const handleUpdateStatus = async (reservation, newStatus) => {
    try {
      const startDateObj = reservation.startDate?.toDate ? reservation.startDate.toDate() : new Date(reservation.startDate);
      const endDateObj = reservation.endDate?.toDate ? reservation.endDate.toDate() : new Date(reservation.endDate);
      
      const updateData = {
        villaId: reservation.villaId,
        startDate: startDateObj,
        endDate: endDateObj,
        status: newStatus,
        updatedAt: new Date()
      };
      
      await adminUpdateReservation(reservation.id, updateData, true);
      setReservations(prev => prev.map(r => r.id === reservation.id ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert("Rezervasyon güncellenirken bir hata oluştu.");
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (window.confirm("Reddedilmiş bu rezervasyonu silmek istediğinize emin misiniz?")) {
      try {
        await deleteDoc(doc(db, "reservations", reservationId));
        setReservations(prev => prev.filter(r => r.id !== reservationId));
      } catch (err) {
      }
    }
  };

  const getReceiptLink = (item) => {
    const url = item?.receiptUrl || item?.dekontUrl || item?.paymentReceiptUrl || item?.paymentReceipt;
    if (!url) return null;
    if (url === true || url === "true" || url === "dekont_yuklendi" || url === "false") {
      return null;
    }
    if (typeof url !== "string") return null;
    const trimmed = url.trim();
    if (trimmed === "") return null;
    return trimmed;
  };

  const renderStatusBadge = (item) => {
    const receiptLink = getReceiptLink(item);
    
    if (item?.status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          Onaylandı
        </span>
      );
    }
    if (item?.status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Reddedildi
        </span>
      );
    }
    if (item?.status === "pending_approval" || (receiptLink && item?.status === "pending")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
          Dekont Bekliyor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/25">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500"></span>
        </span>
        Beklemede
      </span>
    );
  };

  function formatDate(timestamp) {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (e) {
      return "-";
    }
  }

  const sortedReservations = reservations.slice().sort((a, b) => {
    if (a.status === "pending_approval" && b.status !== "pending_approval") return -1;
    if (a.status !== "pending_approval" && b.status === "pending_approval") return 1;
    return 0;
  });

  return (
    <MainLayout title="Rezervasyon Yönetimi">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Sistemde kayıtlı toplam {reservations.length} adet rezervasyon listeleniyor.
        </p>
      </div>

      {loading && (
        <div className="card-base p-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-primary-500 animate-spin mb-4"></div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Rezervasyonlar yükleniyor...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="space-y-6">
          <div className="hidden lg:block overflow-x-auto bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 rounded-2xl backdrop-blur-xl">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-white/5">
              <thead className="bg-neutral-50/40 dark:bg-neutral-950/40">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    Müşteri Bilgileri
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    Villa
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    Tarih Aralığı
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                    Dekont
                  </th>
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                {sortedReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.01] transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-9 w-9 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-primary-400 font-bold text-sm">
                            {(reservation.fullName || "").substring(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {reservation.fullName}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {reservation.email} • {reservation.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{reservation.villaName || "Seçilmemiş"}</div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{reservation.villaId ? `#${reservation.villaId.substring(0, 8)}` : "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700 dark:text-neutral-200">
                        {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {reservation.createdAt && `Kayıt: ${formatDate(reservation.createdAt)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(reservation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getReceiptLink(reservation) ? (
                        <button 
                          type="button"
                          onClick={() => setSelectedReceipt(getReceiptLink(reservation))}
                          className="inline-flex items-center gap-1 bg-primary-500/10 border border-primary-500/25 hover:border-primary-500/40 text-primary-400 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all"
                        >
                          📄 Dekontu Gör
                        </button>
                      ) : (
                        <span className="text-neutral-500 text-xs italic opacity-60">
                          Dekont Yok
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {(reservation.status === "pending_approval" || reservation.status === "pending") && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(reservation, "approved")}
                              className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-950 rounded-xl font-bold text-[10px] tracking-wide uppercase transition-all"
                            >
                              Onayla
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(reservation, "rejected")}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all"
                            >
                              Reddet
                            </button>
                          </>
                        )}
                        
                        {reservation.status === "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReservation(reservation.id)}
                            className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Sil
                          </button>
                        )}

                        <Link
                          to={`/reservations/${reservation.id}`}
                          className="px-3.5 py-1.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detay
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden flex flex-col gap-4">
            {sortedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="card-base p-5 flex flex-col gap-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-primary-400 font-bold text-sm">
                        {(reservation.fullName || "").substring(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-sm leading-tight">{reservation.fullName}</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">{reservation.phone}</p>
                    </div>
                  </div>
                  <div>
                    {renderStatusBadge(reservation)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-200 dark:border-white/5 text-xs">
                  <div>
                    <span className="block text-neutral-500 font-bold uppercase tracking-wider mb-0.5 text-[9px]">Villa</span>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">{reservation.villaName || "Seçilmemiş"}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-500 font-bold uppercase tracking-wider mb-0.5 text-[9px]">Tarih</span>
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                      {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-neutral-200 dark:border-white/5 pb-2">
                  {getReceiptLink(reservation) ? (
                    <button 
                      type="button"
                      onClick={() => setSelectedReceipt(getReceiptLink(reservation))}
                      className="inline-flex items-center gap-1 bg-primary-500/10 border border-primary-500/25 hover:border-primary-500/40 text-primary-400 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all"
                    >
                      📄 Dekontu Gör
                    </button>
                  ) : (
                    <span className="text-neutral-500 text-xs italic opacity-60">
                      Dekont Yok
                    </span>
                  )}
                  {(reservation.status === "pending_approval" || reservation.status === "pending") && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(reservation, "approved")}
                        className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-950 rounded-xl font-bold text-[10px] tracking-wide uppercase transition-all"
                      >
                        Onayla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(reservation, "rejected")}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all"
                      >
                        Reddet
                      </button>
                    </>
                  )}
                  {reservation.status === "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReservation(reservation.id)}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all"
                    >
                      Sil
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">
                    {reservation.createdAt && `Kayıt: ${formatDate(reservation.createdAt)}`}
                  </span>
                  <Link
                    to={`/reservations/${reservation.id}`}
                    className="px-3.5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-950 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                  >
                    Detayları Gör
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div className="card-base p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-neutral-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">Rezervasyon Bulunmamaktadır</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Sistemde kayıtlı herhangi bir rezervasyon bulunmuyor.
          </p>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/50">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Dekont Görseli</h3>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-2 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-100/50 dark:bg-black/40">
              <img 
                src={selectedReceipt} 
                alt="Dekont" 
                className="max-w-full h-auto max-h-[75vh] object-contain rounded-lg border border-neutral-200 dark:border-white/5 shadow-xl"
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}