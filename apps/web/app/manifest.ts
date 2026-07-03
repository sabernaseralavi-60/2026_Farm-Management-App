import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سامانه مدیریت مزرعه حسین‌آباد شهکل",
    short_name: "مزرعه شهکل",
    description: "ثبت آفلاین-اول حضور و غیاب، آبیاری، انبار، حسابداری و عملیات مزرعه",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f2",
    theme_color: "#059669",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
