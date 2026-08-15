import { toFa } from "./jalaali";

export const WORKERS = ["دادعلی", "مرتضی", "عیسی", "موسی", "میلاد", "کارگر روزمزد"];

export const MACHINES = [
  "تراکتور ماهیندرا",
  "تراکتور ۴ سیلندر قدیمی",
  "تراکتور ۴ سیلندر جدید",
  "تراکتور ۶ سیلندر قدیمی",
  "تراکتور ۶ سیلندر جدید",
  "تراکتور رومانی بیل‌دار",
];

export const MACHINERY_CATEGORIES = [
  "⛽ سوخت‌گیری",
  "🧽 نظافت",
  "🛠 سرویس دوره‌ای",
  "⚠️ خرابی/حادثه",
  "🚜 کار در مزرعه",
];

export const GARDENS = Array.from({ length: 20 }, (_, i) => "باغ " + toFa(i + 1));

export const SPRAY_OPS = [
  "سم‌پاشی آفات",
  "قارچ‌کشی",
  "علف‌کشی",
  "کوددهی خاکی",
  "محلول‌پاشی برگی",
];

export const ORCHARD_TASKS = [
  "گرده‌افشانی (تلقیح)",
  "پاجوش‌گیری",
  "هرس و تاج‌بری برگ‌های خشک",
  "تنک‌کردن خوشه",
  "پایین‌کشی و تنظیم خوشه",
  "کیسه‌کشی و پوشش خوشه",
  "برداشت محصول",
  "وجین و علف‌زنی",
  "شخم و خاک‌ورزی",
  "کوددهی پای نخل",
  "مبارزه با آفات",
  "واکاری و کاشت نهال",
  "پاک‌سازی و جمع‌آوری زائدات",
  "مرمت جوی و نهر آبیاری",
  "بازدید و سرکشی",
];

export const ORCHARD_STATUSES = ["انجام شد", "در حال انجام", "برنامه‌ریزی شده"] as const;

export const INVENTORY_UNITS = ["کیلوگرم", "عدد", "لیتر", "کیسه", "متر", "تن"];

export const ACCOUNTING_CATEGORIES = [
  "فروش محصول",
  "دستمزد و حقوق",
  "خرید کود و سم",
  "خرید بذر و نهال",
  "سوخت",
  "تعمیر و قطعات",
  "اجاره و کرایه",
  "حمل‌ونقل",
  "سایر",
];

export const HARVEST_PRODUCTS = ["خرما", "رطب", "خارک", "محصول جانبی", "سایر"];

export const SHEEP_CATS = [
  "تولد بره/بزغاله",
  "تلفات",
  "بیماری و درمان",
  "واکسیناسیون",
  "خرید دام",
  "فروش دام",
  "مصرف علوفه/تغذیه",
  "سایر",
];

export const SEC_TYPES = [
  "ورود غیرمجاز/خرابکاری",
  "خسارت دام همسایه",
  "بازدید/ملاقات رسمی",
  "حادثه",
  "سایر",
];

export const SEC_IDENT = ["بله", "خیر", "در حال بررسی"];

export const SEC_ACTION = [
  "تذکر داده شد",
  "خسارت دریافت شد",
  "پیگیری قانونی/شکایت",
  "بدون اقدام/مختومه",
];

/** One hotspot on an irrigation map image, positioned by percentage (0-100)
 * from the top-left of the image so it stays aligned at any render size. */
export interface IrrigationHotspot {
  x: number;
  y: number;
}

/** The 4 big regions on the guide image (راهنما.jpg) — clicking one opens that zone's garden map. */
export interface IrrigationGuideZone extends IrrigationHotspot {
  zone: 1 | 2 | 3 | 4;
}

export const IRRIGATION_GUIDE_IMAGE = "/irrigation/guide.jpg";

export const IRRIGATION_GUIDE_ZONES: IrrigationGuideZone[] = [
  { zone: 1, x: 10.2, y: 52.1 },
  { zone: 2, x: 45.7, y: 84.8 },
  { zone: 3, x: 48.0, y: 51.1 },
  { zone: 4, x: 73.7, y: 25.3 },
];

/** One garden button on a zone image. */
export interface IrrigationGarden extends IrrigationHotspot {
  n: number;
}

export interface IrrigationZone {
  zone: 1 | 2 | 3 | 4;
  title: string;
  image: string;
  /** Native pixel size of the map image — used to keep hotspots aligned and to cap upscaling. */
  width: number;
  height: number;
  /** Below this width (px), gardens sit closer than is comfortably tappable — the
   * zone map is shown at (at least) this width and scrolls horizontally instead of shrinking further. */
  minDisplayWidth: number;
  gardens: IrrigationGarden[];
}

export const IRRIGATION_ZONES: IrrigationZone[] = [
  {
    zone: 1,
    title: "منطقه ۱",
    image: "/irrigation/zone-1.jpg",
    width: 520,
    height: 720,
    minDisplayWidth: 420,
    gardens: [
      { n: 1, x: 62.4, y: 15.2 },
      { n: 2, x: 53.1, y: 33.2 },
      { n: 3, x: 47.7, y: 50.4 },
      { n: 4, x: 48.3, y: 66.8 },
      { n: 5, x: 33.7, y: 80.9 },
    ],
  },
  {
    zone: 2,
    title: "منطقه ۲",
    image: "/irrigation/zone-2.jpg",
    width: 1280,
    height: 554,
    minDisplayWidth: 680,
    gardens: [
      { n: 6, x: 5.0, y: 59.8 },
      { n: 7, x: 14.0, y: 72.0 },
      { n: 8, x: 18.6, y: 51.1 },
      { n: 9, x: 27.6, y: 72.6 },
      { n: 10, x: 36.8, y: 30.0 },
      { n: 11, x: 41.2, y: 46.6 },
      { n: 12, x: 46.2, y: 67.0 },
      { n: 13, x: 47.7, y: 86.3 },
      { n: 14, x: 53.7, y: 39.0 },
      { n: 15, x: 58.2, y: 60.5 },
      { n: 16, x: 66.0, y: 79.0 },
      { n: 17, x: 66.9, y: 20.6 },
      { n: 18, x: 70.6, y: 39.5 },
      { n: 19, x: 80.2, y: 46.3 },
      { n: 20, x: 84.3, y: 65.0 },
      { n: 21, x: 84.1, y: 10.1 },
      { n: 22, x: 87.2, y: 28.1 },
    ],
  },
  {
    zone: 3,
    title: "منطقه ۳",
    image: "/irrigation/zone-3.jpg",
    width: 1208,
    height: 720,
    minDisplayWidth: 680,
    gardens: [
      { n: 23, x: 59.8, y: 89.5 },
      { n: 24, x: 70.6, y: 75.4 },
      { n: 25, x: 56.2, y: 60.2 },
      { n: 26, x: 77.9, y: 58.8 },
      { n: 27, x: 94.8, y: 52.9 },
      { n: 28, x: 57.4, y: 45.2 },
      { n: 29, x: 75.5, y: 44.7 },
      { n: 30, x: 57.4, y: 27.2 },
      { n: 31, x: 75.4, y: 27.2 },
      { n: 32, x: 57.4, y: 10.4 },
      { n: 33, x: 75.5, y: 10.8 },
      { n: 34, x: 41.0, y: 16.1 },
      { n: 35, x: 42.9, y: 45.7 },
      { n: 36, x: 24.4, y: 44.3 },
      { n: 37, x: 20.5, y: 59.9 },
      { n: 38, x: 23.3, y: 78.1 },
      { n: 39, x: 28.1, y: 89.4 },
    ],
  },
  {
    zone: 4,
    title: "منطقه ۴",
    image: "/irrigation/zone-4.jpg",
    width: 555,
    height: 459,
    minDisplayWidth: 420,
    gardens: [
      { n: 40, x: 32.9, y: 63.2 },
      { n: 41, x: 63.1, y: 74.3 },
      { n: 42, x: 39.0, y: 35.8 },
      { n: 43, x: 66.4, y: 48.2 },
    ],
  },
];

export const IRRIGATION_GARDEN_TOTAL = IRRIGATION_ZONES.reduce((a, z) => a + z.gardens.length, 0);

export function irrigationZoneOfGarden(n: number): 1 | 2 | 3 | 4 | undefined {
  return IRRIGATION_ZONES.find((z) => z.gardens.some((g) => g.n === n))?.zone;
}

export function genUid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
