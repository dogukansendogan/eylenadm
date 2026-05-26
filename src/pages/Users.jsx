import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import MainLayout from "../components/MainLayout";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    async function loadUsers() {
      try {
        const usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(usersQuery);
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
        setLoading(false);
      } catch (err) {
        setError("Kullanıcılar yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  function formatDate(timestamp) {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "-";
    }
  }

  function openEditModal(user) {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || ""
    });
    setShowEditModal(true);
  }

  function openDeleteModal(user) {
    setDeletingUser(user);
    setShowDeleteModal(true);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function updateUser() {
    if (!formData.fullName || !formData.email) {
      alert("Ad Soyad ve E-posta alanları zorunludur.");
      return;
    }
    try {
      setUpdating(true);
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        updatedAt: new Date()
      });
      setUsers(prev => 
        prev.map(user => 
          user.id === editingUser.id ? {
            ...user,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            updatedAt: new Date()
          } : user
        )
      );
      setShowEditModal(false);
      setEditingUser(null);
      alert("Kullanıcı bilgileri başarıyla güncellendi.");
    } catch (err) {
      alert("Kullanıcı bilgileri güncellenirken bir hata oluştu.");
    } finally {
      setUpdating(false);
    }
  }

  async function deleteUser() {
    try {
      setUpdating(true);
      await deleteDoc(doc(db, "users", deletingUser.id));
      setUsers(prev => prev.filter(user => user.id !== deletingUser.id));
      setShowDeleteModal(false);
      setDeletingUser(null);
      alert("Kullanıcı başarıyla silindi.");
    } catch (err) {
      alert("Kullanıcı silinirken bir hata oluştu.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <MainLayout title="Kullanıcı Yönetimi">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Sistemde kayıtlı toplam {users.length} adet kullanıcı listeleniyor.
        </p>
      </div>

      {loading && (
        <div className="card-base p-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-300 dark:border-neutral-800 border-t-primary-500 animate-spin mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">Kullanıcılar yükleniyor...</p>
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
      
      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 rounded-2xl backdrop-blur-xl">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-white/5">
            <thead className="bg-neutral-50/40 dark:bg-neutral-950/40">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Kullanıcı Bilgisi
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  İletişim
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Kayıt Tarihi
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Hesap Durumu
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01] transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                          {(user.fullName || "").substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {user.fullName || "-"}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-500 font-mono mt-0.5">
                          {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-700 dark:text-neutral-200">{user.email || "-"}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{user.phone || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                    {formatDate(user.createdAt || user.registeredAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.emailVerified ? (
                      <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></span>
                        Onaylı Hesap
                      </span>
                    ) : (
                      <span className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        Doğrulanmamış
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Düzenle
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && !error && users.length === 0 && (
        <div className="card-base p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">Kullanıcı Bulunmamaktadır</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-450">
            Sistemde kayıtlı herhangi bir kullanıcı bulunmuyor.
          </p>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up">
            <div className="bg-neutral-50/40 dark:bg-neutral-950/40 border-b border-neutral-200 dark:border-white/5 px-6 py-4 text-neutral-900 dark:text-white">
              <h3 className="text-base font-bold uppercase tracking-wider">
                Kullanıcı Düzenle
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Telefon Numarası
                </label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-white dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-white/5 bg-neutral-50/20 dark:bg-neutral-950/20">
              <button
                type="button"
                className="px-4 py-2.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-semibold transition-all"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
              >
                İptal
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all"
                onClick={updateUser}
                disabled={updating}
              >
                {updating ? "Güncelleniyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="bg-neutral-50/40 dark:bg-neutral-950/40 border-b border-neutral-200 dark:border-white/5 px-6 py-4 text-neutral-900 dark:text-white">
              <h3 className="text-base font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Kullanıcı Sil
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <strong className="text-neutral-900 dark:text-white">{deletingUser?.fullName || deletingUser?.email}</strong> isimli kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-white/5 bg-neutral-50/20 dark:bg-neutral-950/20">
              <button
                type="button"
                className="px-4 py-2.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-semibold transition-all"
                onClick={() => setShowDeleteModal(false)}
                disabled={updating}
              >
                İptal
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                onClick={deleteUser}
                disabled={updating}
              >
                {updating ? "Siliniyor..." : "Kullanıcıyı Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}