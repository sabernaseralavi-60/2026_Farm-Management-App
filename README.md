# سامانه مدیریت مزرعه حسین‌آباد شهکل

سامانه‌ی مدرن، آفلاین-اول و موبایل-محور برای مدیریت روزانه‌ی عملیات یک مزرعه‌ی نخلستان: حضور و غیاب، آبیاری، کود و سم، امورات باغی، انبارداری، حسابداری، برداشت و فروش، پرورش گوسفند و امنیت — به همراه یک بک‌اند اختصاصی برای همگام‌سازی ابری بدون از دست رفتن داده، و یک داشبورد تحلیلی برای مالک مزرعه.

📖 مستندات کامل (معرفی، معماری، راهنمای کاربری و دیپلوی): پوشه‌ی [`apps/docs`](apps/docs) — با `npm run dev:docs` محلی اجرا کنید.

## ساختار مخزن

```text
/
├── apps/
│   ├── web/     ← اپ اصلی Next.js: PWA کارگری آفلاین-اول + API بک‌اند + داشبورد مالک
│   └── docs/    ← سایت مستندات (Nextra)
├── legacy/
│   └── farm-windows.html   ← نمونه اولیه‌ی تک‌فایلی اصلی، به‌عنوان مرجع تاریخی
└── Prompt.md    ← بریف اولیه‌ی پروژه
```

## شروع سریع

```bash
npm install

# دیتابیس محلی (بدون نیاز به Docker یا حساب کاربری):
cd apps/web && npx prisma dev

# در یک ترمینال دیگر، از ریشه‌ی مخزن:
npm run dev:web    # http://localhost:3000
npm run dev:docs   # http://localhost:3001 (یا پورت بعدی آزاد)
```

جزئیات کامل راه‌اندازی (متغیرهای محیطی، دیتابیس Neon برای Production، ساخت اکانت مالک) در [`apps/docs/content/deployment.mdx`](apps/docs/content/deployment.mdx).

## پشته‌ی فناوری

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Dexie.js/IndexedDB · Zustand · Prisma · PostgreSQL · Recharts · Nextra

شرح کامل تصمیمات معماری در [`apps/docs/content/architecture.mdx`](apps/docs/content/architecture.mdx).
