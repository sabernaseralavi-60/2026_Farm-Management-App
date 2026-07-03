import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { SyncEngineInit } from "@/components/system/sync-engine-init";
import { SwRegister } from "@/components/system/sw-register";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سامانه مدیریت مزرعه حسین‌آباد شهکل",
  description: "سامانه آفلاین-اول مدیریت عملیات مزرعه: حضور و غیاب، آبیاری، انبار، حسابداری و بیشتر.",
  manifest: "/manifest.webmanifest",
  applicationName: "مزرعه حسین‌آباد شهکل",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مزرعه شهکل",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth" className={vazirmatn.variable}>
      <body className="min-h-screen antialiased">
        <SyncEngineInit />
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
