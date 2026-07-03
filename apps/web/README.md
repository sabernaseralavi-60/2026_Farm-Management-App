# apps/web

اپ اصلی Next.js (App Router) — شامل سه بخش:

- **PWA کارگری آفلاین-اول** در `app/(worker)/*` (۱۰ دفتر عملیاتی + گزارش مدیریتی)
- **API بک‌اند** در `app/api/*` (`/api/sync/[module]` برای همگام‌سازی idempotent، `/api/owner/*` برای احراز هویت مالک)
- **داشبورد مالک** در `app/owner/*`

راه‌اندازی و دستورات کامل: به [مستندات دیپلوی](../docs/content/deployment.mdx) یا `README.md` ریشه‌ی مخزن مراجعه کنید.

```bash
npm install
npx prisma dev      # دیتابیس Postgres محلی، بدون نیاز به Docker
npm run dev          # apps/web/package.json → next dev
```
