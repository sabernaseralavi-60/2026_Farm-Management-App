# apps/docs

سایت مستندات سامانه، ساخته‌شده با [Nextra](https://nextra.site) (تم `nextra-theme-docs`).

محتوا در پوشه‌ی [`content/`](content) به‌صورت فایل‌های `.mdx` نگه‌داری می‌شود و ترتیب آن‌ها در [`content/_meta.ts`](content/_meta.ts) مشخص شده.

```bash
npm install
npm run dev   # next dev
```

> **نکته:** نسخه‌ی `nextra`/`nextra-theme-docs` عمداً روی `4.5.1` (بدون `^`) قفل شده — نسخه‌های `4.6.0` و `4.6.1` یک باگ رگرسیون در کامپوننت `Layout` دارند (خطای Zod `"expected nonoptional, received undefined" at children` روی هر صفحه، زیر Next.js 16.2 + React Compiler) که در ۴.۵.۱ وجود ندارد. قبل از ارتقا، این مشکل را دوباره بررسی کنید.
