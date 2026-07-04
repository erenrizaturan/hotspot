# HotSpot 🪄

Freelancer, gig çalışan ve serbest meslek sahipleri için düzensiz gelir bütçe asistanı.

**Tek soru:** "Bu ay X geldi ama gelecek ay belirsiz — ne kadarını güvenle harcayabilirim?"

**Canlı:** https://hotspot-vert.vercel.app

## Ne yapar?

- **Güvenle harcanabilir tutarı** saniyeler içinde gösterir
- **Vergi kenarını** (Dokunulmaz Kavanoz) gelirden anında ayırır
- **Kazan süresi** (runway) hesaplar: hiç gelir gelmese kaç ay dayanırsın?
- **Abonelik dedektörü** tekrar eden ödemeleri otomatik tespit eder
- **Hedef takibi** ile birikim hedeflerinin ilerlemesini izler
- **PIN kilidi** ile uygulamayı yetkisiz erişime karşı korur
- **İksir havuzu** ile hedeflere özel fon ayırır
- **Tema geçişi** (açık/koyu mod) desteği
- **PDF rapor** oluşturma
- Tüm veriler **yalnızca cihazında** kalır — sunucu yok, hesap yok

## Nasıl çalıştırılır?

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Prodüksiyon build
npx vitest run    # Testler
```

## iPhone'a nasıl yüklenir?

1. Safari'den `localhost:3000` adresi aç (ya da Vercel URL'i)
2. Paylaş → Ana Ekrana Ekle
3. Uygulama tam ekran açılır, internetsiz çalışır

## Mimari

- **Next.js 16 (App Router) + TypeScript + Tailwind**
- **Dexie.js** — IndexedDB, tüm veriler cihazda
- **Zustand** — global state
- **Recharts** — gelir grafiği
- **shadcn/ui** — UI bileşenleri
- **@ducanh2912/next-pwa** — PWA + çevrimdışı destek

## Mantık

```
Gelir (brüt) → Vergi kenarı ayrılır → Net tampona girer
Tampon - Güvenlik tamponu = Kullanılabilir
safeToSpend = min(hedef maaş, kullanılabilir)
```

Kazan metaforu: gelir kazana akar, vergi kavanoza ayrılır, güvenli miktar kazandan çekilir.
