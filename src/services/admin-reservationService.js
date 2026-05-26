/**
 * Bu dosya, admin panelde rezervasyon durumunu güncellemek için kullanılır.
 * Admin panelde bu dosyayı import ederek kullanabilirsiniz.
 */

import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";

/**
 * İki tarih arasındaki tüm günleri YYYY-MM-DD formatında döndürür
 */
export const getDatesInRange = (startDate, endDate) => {
  const dateArray = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  // Başlangıç ve bitiş tarihleri dahil
  while (currentDate <= lastDate) {
    dateArray.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD formatı
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateArray;
};

/**
 * Villa'nın dolu tarihlerini getirir
 */
export const getVillaBookedDates = async (villaId) => {
  try {
    if (!villaId) {
      throw new Error("Villa ID gereklidir");
    }
    
    // Villa belgesini al
    const villaRef = doc(db, "villalar", villaId);
    const villaDoc = await getDoc(villaRef);
    
    if (!villaDoc.exists()) {
      throw new Error(`Villa bulunamadı: ${villaId}`);
    }
    
    // Dolu tarihleri döndür
    const villaData = villaDoc.data();
    return villaData.doluTarihler || [];
  } catch (error) {

    throw error;
  }
};

/**
 * Villa'nın belirli bir tarih aralığındaki doluluk durumunu temizler
 */
export const clearVillaBookedDatesRange = async (villaId, startDate, endDate) => {
  try {
    if (!villaId) {
      throw new Error("Villa ID gereklidir");
    }
    
    // Tarih aralığını hesapla
    const dateRange = getDatesInRange(
      startDate instanceof Date ? startDate : new Date(startDate),
      endDate instanceof Date ? endDate : new Date(endDate)
    );
    
    // Villa belgesini al
    const villaRef = doc(db, "villalar", villaId);
    
    // Her tarihi kaldır
    for (const dateStr of dateRange) {
      await updateDoc(villaRef, {
        doluTarihler: arrayRemove(dateStr)
      });
    }
    

    return true;
  } catch (error) {

    throw error;
  }
};

/**
 * Villa'nın tüm doluluk tarihlerini temizler
 */
export const clearAllVillaBookedDates = async (villaId) => {
  try {
    if (!villaId) {
      throw new Error("Villa ID gereklidir");
    }
    
    // Villa belgesini al
    const villaRef = doc(db, "villalar", villaId);
    
    // Tüm doluTarihler'i boş bir dizi yap
    await updateDoc(villaRef, {
      doluTarihler: []
    });
    

    return true;
  } catch (error) {

    throw error;
  }
};

/**
 * Rezervasyon onaylandığında, villanın doluTarihler alanını güncellers
 * Admin panelde bu fonksiyonu kullanarak, onaylanan rezervasyonların tarihlerini
 * villanın doluTarihler alanına ekleyebilirsiniz.
 */
export const updateVillaBookedDates = async (villaId, startDate, endDate) => {
  try {
    if (!villaId || !startDate || !endDate) {
      throw new Error("Villa ID, başlangıç tarihi ve bitiş tarihi gereklidir");
    }
    
    // Tarihler arasındaki tüm günleri hesapla
    const dateRange = getDatesInRange(startDate, endDate);
    

    
    // Villa belgesini al
    const villaRef = doc(db, "villalar", villaId);
    const villaDoc = await getDoc(villaRef);
    
    if (!villaDoc.exists()) {
      throw new Error(`Villa bulunamadı: ${villaId}`);
    }
    
    // Mevcut doluTarihler'i al (eğer varsa)
    const villaData = villaDoc.data();

    
    // Villa belgesindeki doluTarihler alanını güncelle
    // NOT: arrayUnion kullanarak her tarihi tek tek ekliyoruz, 
    // çünkü ...dateRange şeklinde kullanırsak maksimum 500 öğelik sınıra takılabiliriz
    for (const dateStr of dateRange) {
      await updateDoc(villaRef, {
        doluTarihler: arrayUnion(dateStr)
      });
    }
    

    return true;
  } catch (error) {

    throw error;
  }
};

/**
 * Rezervasyon reddedildiğinde veya iptal edildiğinde, villanın doluTarihler alanından 
 * ilgili tarihleri kaldırır
 */
export const removeVillaBookedDates = async (villaId, startDate, endDate) => {
  try {
    if (!villaId || !startDate || !endDate) {
      throw new Error("Villa ID, başlangıç tarihi ve bitiş tarihi gereklidir");
    }
    
    // Tarihler arasındaki tüm günleri hesapla
    const dateRange = getDatesInRange(startDate, endDate);
    

    
    // Villa belgesini al
    const villaRef = doc(db, "villalar", villaId);
    const villaDoc = await getDoc(villaRef);
    
    if (!villaDoc.exists()) {
      throw new Error(`Villa bulunamadı: ${villaId}`);
    }
    
    // Villa belgesindeki doluTarihler alanından tarihleri kaldır
    for (const dateStr of dateRange) {
      await updateDoc(villaRef, {
        doluTarihler: arrayRemove(dateStr)
      });
    }
    

    return true;
  } catch (error) {

    throw error;
  }
};

/**
 * Admin panelde bu fonksiyonu güncelleyerek, rezervasyonun durumunu değiştirebilir
 * ve onaylandığında dolu tarihleri otomatik olarak güncelleyebilirsiniz.
 */
export const adminUpdateReservation = async (reservationId, updateData, updateBookedDates = false) => {
  try {
    // Rezervasyon belgesini almak için
    const reservationRef = doc(db, "reservations", reservationId);
    const reservationDoc = await getDoc(reservationRef);
    
    if (!reservationDoc.exists()) {
      throw new Error(`Rezervasyon bulunamadı: ${reservationId}`);
    }
    
    // Mevcut rezervasyon verilerini al
    const reservationData = reservationDoc.data();
    const oldStatus = reservationData.status;
    const newStatus = updateData.status;
    
    // Rezervasyon belgesini güncelle
    await updateDoc(reservationRef, updateData);
    
    // Eğer işlem "güncellemeleri yönet" seçeneği ile yapılıyorsa
    if (updateBookedDates) {
      // Rezervasyon onaylanıyorsa doluTarihler'e ekle
      if (newStatus === "approved") {
        await updateVillaBookedDates(
          updateData.villaId,
          updateData.startDate instanceof Date ? updateData.startDate : new Date(updateData.startDate),
          updateData.endDate instanceof Date ? updateData.endDate : new Date(updateData.endDate)
        );
      } 
      // Rezervasyon reddediliyor veya beklemede durumuna alınıyorsa ve önceden approved ise
      else if ((newStatus === "rejected" || newStatus === "pending") && oldStatus === "approved") {
        await removeVillaBookedDates(
          updateData.villaId || reservationData.villaId,
          updateData.startDate instanceof Date ? updateData.startDate : new Date(updateData.startDate || reservationData.startDate),
          updateData.endDate instanceof Date ? updateData.endDate : new Date(updateData.endDate || reservationData.endDate)
        );
      }
    }
    
    return true;
  } catch (error) {

    throw error;
  }
}; 