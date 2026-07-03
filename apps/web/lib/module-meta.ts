export interface ModuleMeta {
  key: string;
  href: string;
  icon: string;
  navLabel: string;
  title: string;
  subtitle: string;
  from: string;
  to: string;
}

export const MODULE_META: ModuleMeta[] = [
  {
    key: "attendance",
    href: "/attendance",
    icon: "👥",
    navLabel: "حضور و غیاب",
    title: "حضور و غیاب و عملکرد",
    subtitle: "ثبت شیفت صبح/عصر، مرخصی، کیفیت و پاداش روزانه‌ی کارگران",
    from: "#059669",
    to: "#047857",
  },
  {
    key: "machinery",
    href: "/machinery",
    icon: "🚜",
    navLabel: "ماشین‌آلات",
    title: "لاگ‌بوک ماشین‌آلات",
    subtitle: "شناسنامه و رویدادهای تراکتورها و ماشین‌آلات مزرعه",
    from: "#7a5736",
    to: "#46301d",
  },
  {
    key: "irrigation",
    href: "/irrigation",
    icon: "💧",
    navLabel: "آبیاری",
    title: "ماتریس آبیاری (۲۰۰ آبریز)",
    subtitle: "ثبت و بایگانی آبیاری به‌تفکیک هر روز",
    from: "#0ea5e9",
    to: "#0369a1",
  },
  {
    key: "spray",
    href: "/spray",
    icon: "🌿",
    navLabel: "کود و سم",
    title: "دفتر کود و سم‌پاشی",
    subtitle: "ثبت عملیات تغذیه و مبارزه با آفات به‌تفکیک باغ",
    from: "#14b8a6",
    to: "#0f766e",
  },
  {
    key: "orchard",
    href: "/orchard",
    icon: "🌴",
    navLabel: "امورات باغی",
    title: "امورات باغی (۲۰ باغ)",
    subtitle: "کارهای مرسوم نخلستان از گرده‌افشانی تا برداشت",
    from: "#2f9e44",
    to: "#14532d",
  },
  {
    key: "inventory",
    href: "/inventory",
    icon: "📦",
    navLabel: "انبارداری",
    title: "دفتر انبارداری",
    subtitle: "ثبت ورود/خروج اقلام و موجودی برآوردی انبار",
    from: "#d97706",
    to: "#92400e",
  },
  {
    key: "accounting",
    href: "/accounting",
    icon: "💰",
    navLabel: "حسابداری",
    title: "دفتر حسابداری",
    subtitle: "ثبت درآمد و هزینه و محاسبه‌ی سود/زیان",
    from: "#10b981",
    to: "#0f766e",
  },
  {
    key: "harvest",
    href: "/harvest",
    icon: "🌾",
    navLabel: "برداشت و فروش",
    title: "برداشت و فروش محصول",
    subtitle: "ثبت برداشت، فروش و درآمد محصولات نخلستان",
    from: "#f59e0b",
    to: "#b45309",
  },
  {
    key: "sheep",
    href: "/sheep",
    icon: "🐑",
    navLabel: "پرورش گوسفند",
    title: "دفتر پرورش گوسفند",
    subtitle: "ثبت تولد، تلفات، خریدوفروش و رویدادهای دامداری",
    from: "#a16207",
    to: "#422006",
  },
  {
    key: "security",
    href: "/security",
    icon: "🛡️",
    navLabel: "امنیت و تردد",
    title: "امنیت و تردد",
    subtitle: "ثبت حوادث، بازدیدها و تردد غیرعادی در محدوده مزرعه",
    from: "#475569",
    to: "#1e293b",
  },
  {
    key: "reports",
    href: "/reports",
    icon: "📋",
    navLabel: "گزارش مدیریتی",
    title: "گزارش مدیریتی",
    subtitle: "جمع‌بندی همه‌ی دفاتر و تولید گزارش آماده برای مدیریت",
    from: "#69492c",
    to: "#334155",
  },
];

export function findModuleMeta(key: string) {
  return MODULE_META.find((m) => m.key === key);
}
