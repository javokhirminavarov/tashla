# TASHLA UI/UX Yaxshilash — Claude Code Topshiriq
---

### 1.1 FAB (Floating Action Button) — "+Yozish" tugmasini o'zgartirish

**Muammo:** Hozir "+ Yozish" tugmasi sahifa eng pastida, scroll qilmasdan ko'rinmaydi. Bu app'ning eng muhim tugmasi — har kunlik logging CTA'si.

**Yechim:** Hozirgi pastdagi to'liq kengliktdagi "+ Yozish" tugmasini olib tashlab, o'rniga FAB (Floating Action Button) qo'yish:
- Faqat Dashboard (Asosiy) sahifada ko'rinsin
- Joylashuvi: o'ng pastda, bottom nav bar'dan ~16px yuqorida
- O'lchami: 56x56px doira
- Rangi: brand green (#1fc762)
- Ichida: "+" belgisi (oq, 24px)
- Shadow: glow effekt (hozirgi shadow-glow classidan foydalanish mumkin)
- `position: fixed`, `z-index` nav bar'dan yuqori
- Bosganda: hozirgi BottomSheet ochilsin (mavjud funksionallik o'zgarmaydi)
- Active state: `active:scale-95` (hozirgi pattern)
- Boshqa sahifalarda (Statistika, Salomatlik, Do'stlar, Profil) ko'rinMAsin

### 1.2 Statistika sahifasi — tooltip bug fix

**Muammo:** Stats sahifasidagi haftalik grafik tooltip'ida bir xil ma'lumot ikki marta ko'rinyapti — "sigaret: 0" (kichik harf) va "Sigaret: 0" (katta harf). Ikkalasi bir vaqtda ko'rinadi.

**Yechim:** Tooltip'da faqat bitta qator ko'rinsin: "Sigaret: 0" (katta harf bilan). Duplicate'ni toping va olib tashlang. Recharts custom tooltip component'ida bo'lishi mumkin.

---

### 2.1 Dashboard — Circular Progress Ring kichiklashtirish

**Muammo:** Progress ring ekranning ~40% ini egallayapti, pastdagi elementlarni pastga surib yubormoqda.

**Yechim:** 
- Ring SVG container'ini ~20% kichiklashtiring (hozirgi o'lchamdan)
- Ichidagi raqam (masalan "2") va "/ 10 dona" matn o'lchamlari proporsional kichiklansin
- Ring ustidagi header (sana) va ring ostidagi elementlar orasidagi spacing ham proporsional kamaysin

### 2.2 Dashboard — Elementlar orasidagi ortiqcha spacing

**Muammo:** Odat mini-kartalari (Sigaret/Alkogol/Nos), "Bugun tejagan" karta va "Kamaytirish rejasi" karta orasida bo'sh joy ko'p. Bu ham scroll'ni uzaytirmoqda.

**Yechim:**
- 3 ta odat mini-kartasi va "Bugun tejagan" karta orasidagi gap'ni kamaytirilsin (hozirgi gap'dan ~40% kamroq)
- "Bugun tejagan" va "Kamaytirish rejasi" orasidagi gap ham xuddi shunday kamaytirilsin
- Umumiy Dashboard content'i FAB ko'rinishida nav bar + FAB uchun pastda padding qoldiring (FAB ustiga content chiqmasligi uchun)

### 2.3 Dashboard — Odat mini-kartalari border radius

**Muammo:** Kichik kartalar (Sigaret 2/10, Alkogol 0/5, Nos 0/5) uchun border radius juda katta — "kapsula" shaklida ko'rinyapti.

**Yechim:** Bu 3 ta kichik kartaning border-radius'ini kamaytirilsin. Hozirgi rounded-2xl yoki shunga o'xshash classni rounded-xl ga tushirish yetarli bo'lishi mumkin. Boshqa katta kartalar (Bugun tejagan, Kamaytirish rejasi) border radius'i o'zgarmaydi.

### 2.4 Statistika — "Umumiy holat" kartasini kichiklashtirish

**Muammo:** Yashil gradient "Umumiy holat" kartasi juda katta — ekranning deyarli yarmini egallayapti. Undagi ma'lumot kam: faqat progress % va eng yaxshi natija.

**Yechim:**
- Karta balandligini ~40% kamaytirilsin
- "Davom eting!" matn o'lchami biroz kichikroq
- "Siz bu hafta rejalaringizni 22% ga bajardingiz" — hozirgi o'lchamda qoldirish mumkin
- "Eng yaxshi natija" badge — hozirgiday qolsin, lekin karta ichidagi vertical padding kamaysin
- Maqsad: odatlar tahlili (grafiklar) tezroq ko'rinsin, scroll kamaysin

---

### 3.1 Profil — "To'xtatish" tugmasini yaxshilash

**Muammo:** Kamaytirish rejasida "To'xtatish" matni juda kichik qizil matn. Muhim amal uchun kam ko'rinadi.

**Yechim:**
- "To'xtatish" o'rniga "Rejani to'xtatish" deb yozish (aniqroq)
- Matn o'lchamini biroz kattalashtirish (hozirgi text-sm bo'lsa text-base ga)
- Rangini saqlab qolish (qizil/danger) — lekin button-like ko'rinish berish: border yoki background-subtle
- Hali confirmation dialog yo'q bo'lsa — qo'shish: "Rostdan to'xtatmoqchimisiz?" modal bilan "Ha, to'xtatish" / "Bekor qilish" tugmalari

### 3.2 Profil — Odat o'chirish confirmation

**Muammo:** "Faol odatlar" ro'yxatidagi qizil axlat qutisi (delete) tugmasi — tasodifan bosib odat va barcha ma'lumotlarni o'chirib yuborish xavfi bor.

**Yechim:** Delete tugmasi bosilganda confirmation dialog ko'rsating:
- Sarlavha: "Odatni o'chirish"  
- Matn: "{odat nomi} odati va unga oid barcha ma'lumotlar o'chiriladi. Bu amalni qaytarib bo'lmaydi."
- Tugmalar: "O'chirish" (qizil/danger) va "Bekor qilish"

### 3.3 Do'stlar — Bo'sh holat uchun motivatsion xabar

**Muammo:** Faqat bitta guruh bo'lganda ekranning 70% bo'sh ko'rinyapti.

**Yechim:** Guruhlar ro'yxati ostiga (yoki agar guruh yo'q bo'lsa markazda) motivatsion xabar qo'shing:
- Matn: "Do'stlaringiz bilan birga tashlash osonroq! Guruh yarating va taklif kodini ulashing."
- Stil: text-secondary, text-sm, markazlashtirilgan, icon bilan (odamlar yoki qo'l ikonkasi)
- Bu xabar 3+ guruh bo'lganda yo'qolsin (yoki umuman doim ko'rinsa ham OK)

---

## Muhim eslatmalar

- Barcha o'zgarishlar faqat frontend (React components + Tailwind classes)
- Backend API'larga tegmang
- Mavjud Tailwind custom theme ranglarini ishlating (#122017, #1fc762, va h.k.)
- Mobile-only layout (100vw) — desktop ko'rinish haqida o'ylash shart emas
- i18n: yangi matn qo'shsangiz (masalan "Rejani to'xtatish", confirmation dialog matnlari) — UZ va RU translation keys'larini ham qo'shing
