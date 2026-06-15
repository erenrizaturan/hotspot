# GÖREV: "HotSpot" uygulamasını baştan sona, kendi başına kur

> **İNSAN İÇİN — NASIL KULLANILIR (3 adım):**
> 1. Boş bir klasör aç; bu **BUILD.md**'yi ve verilen **simge dosyalarını** (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-icon.png`, `icon.svg`) içine koy.
> 2. O klasörde terminalde `claude` yaz (Claude Code'u başlat).
> 3. Şunu yapıştır: **"Bu klasördeki BUILD.md dosyasını oku ve içindeki uygulamayı baştan sona kur. Klasördeki hazır simge dosyalarını doğru yerlere yerleştir. Tamamlamadan durma."**

---

## 0. AJANA TALİMAT (önce bunu oku)

Bu dosya bir görev brief'idir. Aşağıda tarif edilen uygulamayı **tek başına, baştan sona** kur:

- Her adımı sırayla uygula; kodu yaz, bağımlılıkları kur, projeyi çalıştır.
- **Onay için bekleme.** Belirsiz karar noktalarında en makul varsayılanı seç ve devam et.
- Hata alırsan **kendin düzelt**, gerekirse tekrar dene.
- **Tüm kabul kriterleri (Bölüm 9) yeşil olana kadar durma.** Bitince `npm run build` ve testlerin geçtiğini doğrula.
- Arayüz tasarımında kendi frontend-design becerini uygula: modern, sade, mobil öncelikli, gerçek bir iPhone uygulaması gibi hissettiren bir görünüm. Şablon-default görünümden kaçın.
- Tüm arayüz metinleri **Türkçe**, tüm tutarlar **Türk Lirası (₺)**.

---

## 1. Ürün ne?

Freelancer / gig çalışan / serbest meslek sahipleri için bir **bütçe asistanı**. Tek soruya cevap verir: *"Bu ay X geldi ama gelecek ay belirsiz — ne kadarını güvenle harcayabilirim?"*

Tek mantık: **Tüm gelir bir tampona akar → vergisi anında kenara ayrılır → kullanıcı kendine sabit bir 'maaş' çeker → kıt aylarda tampon taşır.**

Uygulama üç şeyi görünür kılar:
1. **Güvenle harcanabilir tutar** (ekranın merkezindeki büyük "hero" rakam).
2. **Vergi kenarı** (gelirden anında ayrılan, "dokunma" diye işaretlenen tutar).
3. **Dayanma süresi / runway** (hiç gelir gelmese sabit giderleri kaç ay karşılar).

Hedef: kullanıcı uygulamayı açtığında **3 saniyede** "bu ay ne kadar harcayabileceğini" görsün.

---

## 1.5 Marka ve tema — "HotSpot"

Uygulamanın adı **HotSpot** (İngilizce marka adı). Görsel kimlik bir **cadı kazanı** — fikir, uygulama sahibinin kardeşi Eda'nın çocukluk lakabından (**cadı**) geliyor; kazan da "the hot spot", yani gelirin kaynayıp biriktiği o sıcak nokta. Arayüz dili **Türkçe** kalır, yalnızca marka adı İngilizcedir. Temayı arayüze **hafifçe** işle — finans aracının ciddiyetini ve okunabilirliğini koru, abartma.

- **Dil / etiketler (kazan metaforu):**
  - Tampon havuzu → **"Kazan"**
  - Gelir eklemek → **"Kazana ekle"**
  - Vergi kenarı → **"Dokunulmaz kavanoz"**
  - Kendine maaş çekmek → **"Kazandan al"**
  - Dayanma süresi → **"Kazan kaç ay yeter"**
- **Renkler:** ana marka rengi **mor `#7c3aed`**; "güvendesin / harcanabilir" durumu ve **logodaki ₺** **zümrüt yeşili `#10b981`** (kaynayan iksir hissi); uyarılar amber `#f59e0b` / kırmızı `#ef4444`. Arka plan okunabilirlik için açık kalsın.
- **Simge:** mor tam-kare zemin, siyah cadı kazanı, üstte kaynayan yeşil iksir ve kabarcıklar. Kazanın **tam ortasında**, iksirle aynı yeşil (`#10b981`) bir **kabartma ₺** (üst-solda açık yeşil ışık, alt-sağda gölge) ve arkasında çok hafif mor bir hale — para, kazandaki büyülü karışımın kendisi gibi, kazana dökülmüş bir amblem gibi görünür. (Hazır PNG'ler verildi; Bölüm 3.3'e bak.) "Güvenle harcanabilir" kartı pozitifken minik bir kabarcık/parıltı animasyonu opsiyonel; okunabilirlik önce gelir.

---

## 2. Teknoloji yığını + kurulum

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --use-npm --no-src-dir --import-alias "@/*"
npm install dexie zustand recharts @ducanh2912/next-pwa
npm install -D vitest @vitejs/plugin-react jsdom sharp
npx shadcn@latest init -d
```

- **Next.js (App Router) + TypeScript + Tailwind** — ana çatı.
- **Dexie.js (IndexedDB)** — veri yalnızca cihazda kalır. Sunucu yok, hesap yok. *Gizlilik = güven avantajı.*
- **Zustand** — hafif global state.
- **shadcn/ui** — temiz bileşenler. **Recharts** — gelir grafiği.
- **@ducanh2912/next-pwa** — çevrimdışı + yüklenebilir PWA (App Router uyumlu).
- **sharp** — uygulama simgelerini üretmek için.
- Dağıtım: Vercel (ücretsiz). `npm run build` ile yerelde doğrula.

---

## 3. iPhone / PWA gereksinimleri (BU BÖLÜM ZORUNLU)

Uygulama, iPhone'da Safari'den "Ana Ekrana Ekle" ile eklenince **gerçek bir uygulama gibi** davranmalı: tam ekran, doğru simge, çentik/ana çubuk altında içerik kalmamalı, input'a basınca ekran zoom yapmamalı.

### 3.1 `app/layout.tsx` — metadata + viewport
```tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "HotSpot",
  description: "Düzensiz gelir için bütçe asistanı — kazanını bozmadan ne kadar harcayabileceğini gör.",
  applicationName: "HotSpot",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HotSpot",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,     // iOS'ta input zoom'unu sınırla
  userScalable: false,
  viewportFit: "cover", // çentik / safe-area için şart
  themeColor: "#7c3aed",
};
```
`<body>` etiketine `min-h-[100dvh]` ver (iOS adres çubuğu yüksekliği sorununu çözer; `100vh` değil `100dvh` kullan).

### 3.2 `public/manifest.webmanifest`
```json
{
  "name": "HotSpot",
  "short_name": "HotSpot",
  "description": "Düzensiz gelir için bütçe asistanı",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 3.3 Simgeler — HAZIR VERİLDİ (yeniden ÜRETME)

Proje klasöründe simgeler **hazır PNG** olarak duruyor (+ `icon.svg` kaynağı). Bunları **yeniden üretme**; sadece doğru yerlere taşı/yerleştir:
- `icon-192.png` → `public/icons/icon-192.png`
- `icon-512.png` → `public/icons/icon-512.png`
- `icon-maskable-512.png` → `public/icons/icon-maskable-512.png`
- `apple-icon.png` (180×180) → `app/apple-icon.png` (Next.js bunu otomatik apple-touch-icon yapar)
- `app/icon.png` (favicon) → `icon-192.png`'yi kopyalayıp `app/icon.png` olarak adlandır

Tasarım (referans): mor tam-kare zemin, siyah cadı kazanı, üstte kaynayan yeşil iksir ve kabarcıklar, kazanın ortasında iksirle aynı yeşil **kabartma ₺** (üst-solda açık yeşil ışık, alt-sağda gölge) ve arkasında çok hafif mor bir hale. Köşeler **yuvarlatılmamış** (tam kare) — yuvarlak görünümü iOS/Android maskesi verir.

> Eğer bir sebeple PNG'ler klasörde yoksa: `icon.svg`'yi `sharp` ile yukarıdaki boyutlara çevir (maskable için içeriği ~%84'e küçültüp mor zemine ortala).

### 3.4 `app/globals.css` — safe-area + iOS dokunuşları
```css
/* iPhone çentik / ana çubuk: içerik bunların altında kalmasın */
.safe-top    { padding-top: max(env(safe-area-inset-top), 12px); }
.safe-bottom { padding-bottom: max(env(safe-area-inset-bottom), 12px); }

/* iOS: input'a basınca ekranın zoom yapmasını engelle (>=16px şart) */
input, select, textarea { font-size: 16px; }

/* Dokunma vurgusunu sadeleştir, taşmayı engelle */
* { -webkit-tap-highlight-color: transparent; }
html, body { overscroll-behavior-y: none; }
```
Üstteki başlığa `.safe-top`, alttaki sekme çubuğuna `.safe-bottom` sınıfını uygula.

### 3.5 PWA / çevrimdışı — `next.config`
`@ducanh2912/next-pwa` ile sar:
```js
import withPWAInit from "@ducanh2912/next-pwa";
const withPWA = withPWAInit({ dest: "public", disable: process.env.NODE_ENV === "development" });
export default withPWA({ /* mevcut next config */ });
```
Amaç: ilk yüklemeden sonra uygulama **çevrimdışı** açılabilsin. (Kurulurken sorun çıkarsa: manifest + simgeler + apple meta zaten "yüklenebilir + tam ekran" için yeterli; çevrimdışı önbellek ikincil önceliktir, onun için takılıp kalma.)

---

## 4. Hesaplama motoru (ürünün kalbi — önce bunu kodla + test et)

Veriyi **işlem günlüğü** olarak sakla, bakiyeleri günlükten **türet**.

```ts
// lib/types.ts
export type TxnType = "income" | "salary" | "expense" | "tax_payment";

export type Txn = {
  id: string;
  type: TxnType;
  amount: number;          // gelir için BRÜT; diğerleri için net tutar
  date: string;            // ISO tarih
  taxRateAtTime?: number;  // gelir için: o anki vergi oranı (doğruluk için)
  source?: string;
  note?: string;
};

export type Settings = {
  fixedMonthlyExpenses: number;  // F: aylık sabit gider toplamı
  taxRate: number;               // t: 0–1 arası, kullanıcı belirler
  targetSalary: number;          // S: kendine ödemek istediğin aylık tutar
  bufferTargetMonths: number;    // B: kaç aylık tampon hedefin
  startingBufferBalance: number; // başlangıç birikimi (vergi sonrası)
};
```

```ts
// lib/calculations.ts
import type { Txn, Settings } from "./types";

export function deriveState(txns: Txn[], s: Settings) {
  let buffer = s.startingBufferBalance; // vergi-sonrası harcanabilir havuz
  let taxReserve = 0;                    // kenara ayrılan, dokunulmayacak vergi

  for (const tx of txns) {
    if (tx.type === "income") {
      const t = tx.taxRateAtTime ?? s.taxRate;
      buffer += tx.amount * (1 - t);   // net gelir tampona girer
      taxReserve += tx.amount * t;     // vergi anında kenara
    } else if (tx.type === "salary") {
      buffer -= tx.amount;             // kendine ödediğin (yaşam parası)
    } else if (tx.type === "expense") {
      buffer -= tx.amount;             // gider ödemesi
    } else if (tx.type === "tax_payment") {
      taxReserve -= tx.amount;         // vergi ödendi → kenardan düş
    }
  }

  const runwayMonths =
    s.fixedMonthlyExpenses > 0 ? buffer / s.fixedMonthlyExpenses : Infinity;
  const safetyBuffer = s.bufferTargetMonths * s.fixedMonthlyExpenses;
  const aboveBuffer = buffer - safetyBuffer;
  const safeToSpend = Math.max(0, Math.min(s.targetSalary, aboveBuffer));

  return { buffer, taxReserve, runwayMonths, safetyBuffer, aboveBuffer, safeToSpend };
}
```

**Durum renkleri:** `aboveBuffer >= 0` → yeşil ("güvendesin") · `aboveBuffer < 0` ama `buffer > 0` → amber ("tamponuna dokunuyorsun") · `buffer <= 0` → kırmızı ("açıktasın").

`lib/calculations.test.ts` içinde **en az 4 senaryo** için Vitest testi yaz: (1) bolluk ayı, (2) kıt ay, (3) tampon altına düşme, (4) vergi ödemesi sonrası. `npx vitest run` ile hepsi geçmeli.

---

## 5. Veri katmanı

- `lib/db.ts` — Dexie ile veritabanı: `transactions` ve `settings` tabloları.
- `store/useStore.ts` — Zustand store; işlemleri ve ayarları Dexie'den yükler, ekleme/silme/güncelleme sağlar.
- `lib/format.ts` — `₺` biçimlendirme (binlik ayraç, `Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" })`).

---

## 6. Ekranlar (mobil öncelikli)

Alt kısımda sabit bir **sekme çubuğu** (bottom tab bar, `.safe-bottom`): **Panel · İşlem Ekle · Ayarlar**.

**Panel — `app/page.tsx`:** `deriveState` ile 4 kart:
1. **Güvenle harcanabilir** — BÜYÜK, merkezde, duruma göre yeşil/amber/kırmızı + tek cümle açıklama.
2. **Vergi kenarı — "Dokunulmaz kavanoz"** — "Bu para senin değil, dokunma" tonu.
3. **Dayanma süresi** — "Hiç gelir gelmese sabit giderlerini X ay karşılarsın."
4. **Bu ay geliri vs hedef maaş.**
(Opsiyonel) altında son 6–12 ayın gelir bar grafiği (Recharts), hedef maaş yatay çizgi.

**İşlem Ekle — `app/islem/page.tsx`:** tür (gelir / maaş çek / gider / vergi ödeme), tutar, tarih, opsiyonel kaynak + not. Gelirde `taxRateAtTime` kaydet. Altında işlem geçmişi (en yeni üstte), her satır silinebilir/düzenlenebilir.

**Ayarlar — `app/ayarlar/page.tsx`:** aylık sabit gider, vergi oranı (%), hedef aylık maaş, tampon hedefi (ay), başlangıç birikimi. İlk açılışta ayar yoksa kullanıcıyı buraya yönlendir (onboarding).

---

## 7. Cila + güven

- Alt bilgi notu: **"Bu araç finansal/vergi tavsiyesi değildir. Gerçek vergi yükümlülüğün için mali müşavirine danış. Vergi oranını sen belirlersin."**
- Görünür rozet: **"Verilerin yalnızca bu cihazda saklanır."**
- Boş durumlar, yükleniyor durumları, küçük mikro-etkileşimler.
- Tampon altına düşünce panelde net uyarı.

---

## 8. Önerilen dosya yapısı

```
hotspot/
├── app/
│   ├── layout.tsx          # metadata + viewport + PWA meta
│   ├── page.tsx            # Panel (hero rakam + 4 kart)
│   ├── islem/page.tsx     # İşlem ekle + geçmiş
│   ├── ayarlar/page.tsx   # Ayarlar / onboarding
│   ├── globals.css        # safe-area + iOS dokunuşları
│   ├── apple-icon.png     # 180×180 (üretilecek)
│   └── icon.png           # favicon (üretilecek)
├── components/
│   ├── dashboard/ (SafeToSpendCard, TaxReserveCard, RunwayCard, IncomeVsTargetCard)
│   ├── BottomNav.tsx
│   ├── TxnForm.tsx · TxnList.tsx · IncomeChart.tsx
│   └── ui/                # shadcn
├── lib/ (types.ts, calculations.ts, calculations.test.ts, db.ts, format.ts)
├── store/useStore.ts
├── public/
│   ├── manifest.webmanifest
│   └── icons/ (icon-192, icon-512, icon-maskable-512)  ← hazır PNG'ler buraya
├── app/apple-icon.png · app/icon.png  ← hazır PNG'ler buraya
├── next.config.* (next-pwa ile sarılı)
└── README.md (kısa: ne, nasıl çalıştırılır, nasıl yüklenir)
```

---

## 9. KABUL KRİTERLERİ (hepsi sağlanana kadar durma)

- [ ] `npm run build` hatasız geçiyor; TypeScript tip hatası yok.
- [ ] `npx vitest run` — tüm hesaplama testleri geçiyor.
- [ ] `public/manifest.webmanifest` geçerli ve tüm simge dosyaları gerçekten mevcut.
- [ ] `app/apple-icon.png` (180×180) var → iPhone ana ekran simgesi düzgün.
- [ ] Uygulama `display: standalone` ile tam ekran açılıyor (yüklenince adres çubuğu yok).
- [ ] Çentikli iPhone'da içerik çentik/ana çubuk altında kalmıyor (safe-area uygulanmış).
- [ ] Input'a basınca ekran zoom yapmıyor (input font-size 16px).
- [ ] Panelde **"Güvenle harcanabilir"** rakamı saniyeler içinde, merkezde, büyük görünüyor.
- [ ] Sayfa yenilenince veriler kayboluyor mu? **Hayır** — IndexedDB'de kalıcı.
- [ ] Tüm arayüz Türkçe, tüm tutarlar ₺ biçimli.
- [ ] "Finansal tavsiye değildir" notu ve "veriler cihazda kalır" rozeti görünür.
- [ ] Alt sekme çubuğu çalışıyor: Panel / İşlem Ekle / Ayarlar.

Bittiğinde `README.md`'yi güncelle ve `npm run dev` ile çalıştırıp ekranların açıldığını teyit et.

---

## 10. KAPSAM DIŞI (yapma)

Banka entegrasyonu, çoklu kullanıcı, bulut senkron/hesap sistemi, yatırım takibi, vergi oranını uygulamaya gömme. Önce **tek şeyi mükemmel** yap: "bu ay güvenle ne kadar harcayabilirim?" Basitlik ve güvenilirlik en büyük rekabet avantajıdır.
