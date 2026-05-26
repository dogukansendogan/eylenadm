# Eylen Villa Yönetim Paneli

Eylen Villa projesinin yönetim (admin) panelidir. Bu panel üzerinden villaları yönetebilir, rezervasyonları görüntüleyip onaylayabilir, müşteri ve kullanıcı bilgilerini görebilirsiniz.

## Teknolojiler

- **React** + **Vite** (Geliştirme ortamı ve paketleyici)
- **Tailwind CSS** (Şekillendirme ve UI)
- **Firebase** (Firestore Database, Authentication, Storage)
- **React Router v7** (Sayfa içi yönlendirmeler)
- **Vitest & React Testing Library** (Test altyapısı)

## Kurulum ve Çalıştırma

1. Projeyi klonlayın ve bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env.example` dosyasını kopyalayarak `.env` dosyası oluşturun ve Firebase proje bilgilerinizi girin:
   ```bash
   cp .env.example .env
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Ortam Değişkenleri

Uygulamanın çalışması için aşağıdaki `.env` değişkenlerinin ayarlanması gereklidir:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Test ve Geliştirme

Projeyi üretime hazır hale getirmeden önce hataları tespit etmek için:

```bash
# Kodlama standartlarını denetle
npm run lint

# Testleri çalıştır
npm run test

# Üretim (Production) versiyonunu oluştur
npm run build
```

## Güvenlik

Sistem, yetkilendirme olarak Firebase Authentication kullanmaktadır. Yetkisiz girişleri önlemek amacıyla sadece "users" koleksiyonunda `role: "admin"` olarak tanımlı olan kullanıcılar panele erişebilir. Bu doğrulama `AuthContext` ve `PrivateRoute` bileşenleri tarafından güvence altına alınmıştır.
