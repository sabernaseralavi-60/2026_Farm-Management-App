import { prisma } from "./prisma";
import type { TableColumn } from "./table-format";

/** Registry behind the owner dashboard's "مرورگر جدول‌های داده" (data
 * browser) page/API. Every column and search field here is a fixed,
 * server-defined allowlist — the client can only pick a table key, a page,
 * a date range and a free-text query; it can never choose columns or send
 * a raw filter/query, so this stays as safe as the read-only AI Q&A tool
 * while being far more direct for skimming/searching the raw records. */

export type { TableColumn };

interface TableDef {
  label: string;
  icon: string;
  columns: TableColumn[];
  /** String columns searched with a case-insensitive "contains" match. */
  searchFields: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DELEGATES: Record<string, any> = {
  attendance: prisma.attendance,
  machinery: prisma.machinery,
  irrigation: prisma.irrigation,
  spray: prisma.pestFertilizer,
  orchard: prisma.orchard,
  inventory: prisma.inventory,
  accounting: prisma.accounting,
  harvest: prisma.harvest,
  sheep: prisma.sheep,
  security: prisma.security,
};

const TABLES: Record<string, TableDef> = {
  attendance: {
    label: "حضور و غیاب",
    icon: "👥",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "worker", label: "کارگر" },
      { key: "status", label: "وضعیت" },
      { key: "leaveType", label: "نوع مرخصی" },
      { key: "morningIn", label: "ورود صبح" },
      { key: "morningOut", label: "خروج صبح" },
      { key: "morningOk", label: "کیفیت صبح", type: "boolean" },
      { key: "morningBonus", label: "پاداش صبح", type: "number" },
      { key: "eveningIn", label: "ورود عصر" },
      { key: "eveningOut", label: "خروج عصر" },
      { key: "eveningOk", label: "کیفیت عصر", type: "boolean" },
      { key: "eveningBonus", label: "پاداش عصر", type: "number" },
    ],
    searchFields: ["worker"],
  },
  machinery: {
    label: "ماشین‌آلات",
    icon: "🚜",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "machine", label: "ماشین" },
      { key: "driver", label: "راننده" },
      { key: "start", label: "ساعت شروع", type: "number" },
      { key: "end", label: "ساعت پایان", type: "number" },
      { key: "usefulHours", label: "ساعات کارکرد", type: "number" },
      { key: "category", label: "رویداد" },
      { key: "details", label: "جزئیات" },
      { key: "cost", label: "هزینه/مصرف" },
      { key: "photos", label: "عکس", type: "photos" },
    ],
    searchFields: ["machine", "driver", "details", "cost", "category"],
  },
  irrigation: {
    label: "آبیاری",
    icon: "💧",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "worker", label: "آبدار" },
      { key: "count", label: "تعداد باغ", type: "number" },
      { key: "gardens", label: "شماره باغ‌ها", type: "array" },
    ],
    searchFields: ["worker"],
  },
  spray: {
    label: "کود و سم",
    icon: "🌿",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "garden", label: "باغ" },
      { key: "op", label: "عملیات" },
      { key: "material", label: "کود/سم" },
      { key: "dose", label: "دوز" },
      { key: "target", label: "هدف" },
      { key: "operator", label: "اپراتور" },
      { key: "note", label: "توضیحات" },
    ],
    searchFields: ["garden", "op", "material", "target", "operator", "note"],
  },
  orchard: {
    label: "امورات باغی",
    icon: "🌴",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "garden", label: "باغ" },
      { key: "task", label: "نوع کار" },
      { key: "worker", label: "کارگر" },
      { key: "count", label: "تعداد/مقدار", type: "number" },
      { key: "status", label: "وضعیت" },
      { key: "note", label: "توضیحات" },
      { key: "photos", label: "عکس", type: "photos" },
    ],
    searchFields: ["garden", "task", "worker", "note"],
  },
  inventory: {
    label: "انبارداری",
    icon: "📦",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "item", label: "کالا" },
      { key: "type", label: "نوع تراکنش" },
      { key: "qty", label: "مقدار", type: "number" },
      { key: "unit", label: "واحد" },
      { key: "party", label: "طرف" },
      { key: "desc", label: "توضیحات" },
    ],
    searchFields: ["item", "party", "desc"],
  },
  accounting: {
    label: "حسابداری",
    icon: "💰",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "type", label: "نوع" },
      { key: "category", label: "دسته" },
      { key: "amount", label: "مبلغ (تومان)", type: "number" },
      { key: "party", label: "طرف حساب" },
      { key: "desc", label: "توضیحات" },
    ],
    searchFields: ["category", "party", "desc"],
  },
  harvest: {
    label: "برداشت و فروش",
    icon: "🌾",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "product", label: "محصول" },
      { key: "harvested", label: "برداشت (kg)", type: "number" },
      { key: "sold", label: "فروش (kg)", type: "number" },
      { key: "price", label: "قیمت واحد", type: "number" },
      { key: "buyer", label: "خریدار" },
      { key: "note", label: "توضیحات" },
      { key: "photos", label: "عکس", type: "photos" },
    ],
    searchFields: ["product", "buyer", "note"],
  },
  sheep: {
    label: "پرورش گوسفند",
    icon: "🐑",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "category", label: "دسته‌بندی" },
      { key: "count", label: "تعداد", type: "number" },
      { key: "amount", label: "مبلغ (تومان)", type: "number" },
      { key: "person", label: "مسئول" },
      { key: "desc", label: "توضیحات" },
    ],
    searchFields: ["category", "person", "desc"],
  },
  security: {
    label: "امنیت و تردد",
    icon: "🛡️",
    columns: [
      { key: "date", label: "تاریخ" },
      { key: "type", label: "نوع حادثه" },
      { key: "title", label: "عنوان" },
      { key: "desc", label: "شرح" },
      { key: "identified", label: "شناسایی افراد" },
      { key: "action", label: "اقدام انجام‌شده" },
      { key: "reporter", label: "گزارش‌دهنده" },
      { key: "photos", label: "عکس", type: "photos" },
    ],
    searchFields: ["title", "desc", "identified", "action", "reporter"],
  },
};

export type TableKey = keyof typeof TABLES;

export function isTableKey(v: string): v is TableKey {
  return v in TABLES;
}

export function listTables() {
  return Object.entries(TABLES).map(([key, def]) => ({ key, label: def.label, icon: def.icon, columns: def.columns }));
}

export function tableDef(key: TableKey) {
  return TABLES[key];
}

export interface TableQuery {
  page: number;
  pageSize: number;
  q?: string;
  from?: string;
  to?: string;
}

export async function queryTable(key: TableKey, query: TableQuery) {
  const def = TABLES[key];
  const delegate = DELEGATES[key];

  const and: Record<string, unknown>[] = [];
  if (query.from || query.to) {
    const range: Record<string, string> = {};
    if (query.from) range.gte = query.from;
    if (query.to) range.lte = query.to;
    and.push({ date: range });
  }
  if (query.q) {
    and.push({
      OR: def.searchFields.map((field) => ({ [field]: { contains: query.q, mode: "insensitive" } })),
    });
  }
  const where = and.length ? { AND: and } : {};

  const [rows, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    delegate.count({ where }),
  ]);

  return { rows, total, columns: def.columns };
}
