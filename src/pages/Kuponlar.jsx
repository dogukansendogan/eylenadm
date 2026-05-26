import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import MainLayout from "../components/MainLayout";

const EMPTY_FORM = {
  code: "",
  type: "percentage",
  value: "",
  isActive: true,
  endDate: "",
  description: "",
};

export default function Kuponlar() {
  const [kuponlar, setKuponlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [modalAcik, setModalAcik] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [kayitYapiliyor, setKayitYapiliyor] = useState(false);
  const [silmeOnayId, setSilmeOnayId] = useState(null);

  async function kuponlariFetch() {
    try {
      setYukleniyor(true);
      setHata("");
      const q = query(collection(db, "kuponlar"), orderBy("olusturulmaTarihi", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setKuponlar(data);
    } catch (err) {
      setHata("Kuponlar yüklenirken bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    kuponlariFetch();
  }, []);

  async function handleKuponEkle(e) {
    e.preventDefault();
    if (!form.code.trim() || !form.value || !form.endDate) {
      setHata("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    try {
      setKayitYapiliyor(true);
      setHata("");
      const yeniKupon = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        isActive: form.isActive,
        endDate: form.endDate,
        description: form.description.trim(),
        olusturulmaTarihi: new Date(),
      };
      await addDoc(collection(db, "kuponlar"), yeniKupon);
      setBasari(`"${yeniKupon.code}" kuponu başarıyla oluşturuldu.`);
      setModalAcik(false);
      setForm(EMPTY_FORM);
      await kuponlariFetch();
      setTimeout(() => setBasari(""), 4000);
    } catch (err) {
      setHata("Kupon eklenirken bir hata oluştu.");
    } finally {
      setKayitYapiliyor(false);
    }
  }

  async function handleKuponSil(id) {
    try {
      await deleteDoc(doc(db, "kuponlar", id));
      setKuponlar((prev) => prev.filter((k) => k.id !== id));
      setSilmeOnayId(null);
      setBasari("Kupon başarıyla silindi.");
      setTimeout(() => setBasari(""), 3000);
    } catch (err) {
      setHata("Kupon silinirken bir hata oluştu.");
    }
  }

  function kuponDurumu(kupon) {
    if (!kupon.isActive) return { label: "Pasif", style: "bg-neutral-100/60 dark:bg-neutral-950/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/5" };
    const now = new Date();
    const end = new Date(kupon.endDate);
    if (end < now) return { label: "Süresi Doldu", style: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" };
    return { label: "Aktif", style: "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-500/20" };
  }

  function formatTarih(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <MainLayout title="Kupon Yönetimi">
      {basari && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 animate-fade-in">
          <svg className="w-5 h-5 shrink-0 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">{basari}</span>
        </div>
      )}
      {hata && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 animate-fade-in">
          <svg className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">{hata}</span>
          <button onClick={() => setHata("")} className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">✕</button>
        </div>
      )}

      <div className="card-base p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Kullanıcı indirim kodlarını oluşturabilir, süresi dolanları inceleyebilir ve silebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => { setModalAcik(true); setHata(""); }}
          className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500 hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-500 dark:hover:to-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4 text-white dark:text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Kupon Oluştur
        </button>
      </div>

      {!yukleniyor && kuponlar.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Toplam Kupon", value: kuponlar.length, icon: "🎟️" },
            { label: "Aktif", value: kuponlar.filter(k => k.isActive && new Date(k.endDate) >= new Date()).length, icon: "✅" },
            { label: "Süresi Dolmuş", value: kuponlar.filter(k => new Date(k.endDate) < new Date()).length, icon: "⏰" },
            { label: "Pasif", value: kuponlar.filter(k => !k.isActive).length, icon: "🚫" },
          ].map((stat) => (
            <div key={stat.label} className="card-base p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/15 flex items-center justify-center text-sm mb-3">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono">{stat.value}</p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card-base overflow-hidden">
        {yukleniyor ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-primary-500 animate-spin" />
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">Kuponlar yükleniyor…</p>
          </div>
        ) : kuponlar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/15 flex items-center justify-center text-2xl mb-4">
              🎟️
            </div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">Tanımlanmış kupon bulunamadı</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xs">
              Yeni bir indirim kuponu tanımlayarak kampanyalar oluşturabilirsiniz.
            </p>
            <button
              onClick={() => setModalAcik(true)}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mt-6"
            >
              Kupon Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="hidden lg:block overflow-hidden bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 rounded-2xl backdrop-blur-xl">
              <table className="w-full text-sm divide-y divide-neutral-200 dark:divide-white/5">
                <thead className="bg-neutral-100/40 dark:bg-neutral-950/40">
                  <tr>
                    {["Kod", "Tür", "Değer", "Açıklama", "Son Tarih", "Durum", "İşlemler"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                  {kuponlar.map((kupon) => {
                    const durum = kuponDurumu(kupon);
                    return (
                      <tr key={kupon.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.01] transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 px-3 py-1.5 rounded-xl tracking-widest text-xs">
                            {kupon.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/20">
                            {kupon.type === "percentage" ? "📊 Yüzde" : "💰 Sabit TL"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-900 dark:text-white font-bold text-sm">
                          {kupon.type === "percentage"
                            ? `%${kupon.value}`
                            : `${kupon.value?.toLocaleString("tr-TR")} ₺`}
                        </td>
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 max-w-[180px] truncate text-xs leading-relaxed">
                          {kupon.description || "—"}
                        </td>
                        <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300 text-xs">
                          {formatTarih(kupon.endDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${durum.style}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {durum.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {silmeOnayId === kupon.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Emin misin?</span>
                              <button
                                onClick={() => handleKuponSil(kupon.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold transition-all border border-red-200 dark:border-red-500/20"
                              >
                                Sil
                              </button>
                              <button
                                onClick={() => setSilmeOnayId(null)}
                                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all border border-neutral-200 dark:border-white/5"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSilmeOnayId(kupon.id)}
                              className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden flex flex-col gap-4">
              {kuponlar.map((kupon) => {
                const durum = kuponDurumu(kupon);
                return (
                  <div
                    key={kupon.id}
                    className="card-base p-5 flex flex-col gap-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 px-3 py-1.5 rounded-xl tracking-widest text-xs">
                        {kupon.code}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${durum.style}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {durum.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-neutral-200 dark:border-white/5 text-xs">
                      <div>
                        <span className="block text-neutral-500 font-bold uppercase tracking-wider mb-0.5 text-[9px]">Değer</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                          {kupon.type === "percentage"
                            ? `%${kupon.value}`
                            : `${kupon.value?.toLocaleString("tr-TR")} ₺`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-neutral-500 font-bold uppercase tracking-wider mb-0.5 text-[9px]">Tür</span>
                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{kupon.type === "percentage" ? "📊 Yüzde" : "💰 Sabit TL"}</span>
                      </div>
                    </div>

                    {kupon.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {kupon.description}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-neutral-500">
                        Son Tarih: {formatTarih(kupon.endDate)}
                      </span>

                      {silmeOnayId === kupon.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleKuponSil(kupon.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold transition-all border border-red-200 dark:border-red-500/20"
                          >
                            Sil
                          </button>
                          <button
                            onClick={() => setSilmeOnayId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all border border-neutral-200 dark:border-white/5"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSilmeOnayId(kupon.id)}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Kuponu Sil
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="bg-neutral-50 dark:bg-neutral-950/40 border-b border-neutral-200 dark:border-white/5 px-6 py-4 text-neutral-900 dark:text-white">
              <h3 className="text-base font-bold uppercase tracking-wider">Yeni Kupon Oluştur</h3>
            </div>

            <form onSubmit={handleKuponEkle} className="p-6 space-y-4">
              {hata && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-xs">
                  {hata}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Kupon Kodu <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Örn: VILLA2026"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all font-mono tracking-widest text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    İndirim Türü <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  >
                    <option value="percentage" className="bg-white dark:bg-neutral-900">📊 Yüzde (%)</option>
                    <option value="fixed" className="bg-white dark:bg-neutral-900">💰 Sabit TL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Değer <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={form.type === "percentage" ? 100 : undefined}
                      value={form.value}
                      onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                      placeholder={form.type === "percentage" ? "15" : "2500"}
                      className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold pointer-events-none">
                      {form.type === "percentage" ? "%" : "₺"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Son Kullanma Tarihi <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Örn: Balayı çiftlerine özel indirim kodu"
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/5 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/40 focus:bg-neutral-50 dark:focus:bg-neutral-950 outline-none transition-all text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-white/5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Kupon Aktif Mi?</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Pasif kuponlar müşterilerce kullanılamaz.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${form.isActive ? "bg-primary-500" : "bg-neutral-300 dark:bg-neutral-800"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${form.isActive ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setModalAcik(false)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-white/5 rounded-xl text-xs font-semibold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={kayitYapiliyor}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-500 hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-500 dark:hover:to-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {kayitYapiliyor ? "Kaydediliyor…" : "Kuponu Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
