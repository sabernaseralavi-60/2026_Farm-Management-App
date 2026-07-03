import ExcelJS from "exceljs";
import type { AllModulesData, Range } from "./report";
import { byRange } from "./report";
import { IRRIGATION_TOTAL } from "./reference-data";
import type { Synced } from "./types";

const syncLabel = (r: Synced) => (r.synced ? "همگام" : "محلی");

interface SheetDef<T> {
  name: string;
  header: string[];
  row: (r: T) => (string | number)[];
}

function defs(): { [K in keyof AllModulesData]: SheetDef<AllModulesData[K][number]> } {
  const irrigationHeader = ["تاریخ", "آبدار", "تعداد آبیاری‌شده"];
  for (let i = 1; i <= IRRIGATION_TOTAL; i++) irrigationHeader.push("آبریز " + i);
  irrigationHeader.push("وضعیت همگام‌سازی");

  return {
    attendance: {
      name: "حضور و غیاب",
      header: [
        "تاریخ", "کارگر", "وضعیت", "نوع مرخصی",
        "ورود صبح", "خروج صبح", "نوع کار صبح", "کیفیت صبح", "پاداش صبح",
        "ورود عصر", "خروج عصر", "نوع کار عصر", "کیفیت عصر", "پاداش عصر",
        "وضعیت همگام‌سازی",
      ],
      row: (r) => [
        r.date, r.worker, r.status === "leave" ? "مرخصی" : "حاضر", r.leaveType === "unpaid" ? "بدون حقوق" : r.leaveType === "paid" ? "با حقوق" : "",
        r.morning?.in ?? "", r.morning?.out ?? "", r.morning?.workType === "lump" ? "مقطوع" : r.morning ? "پایه" : "", r.morning?.quality ? "تأیید" : "",
        Number(r.morning?.bonus) || 0,
        r.evening?.in ?? "", r.evening?.out ?? "", r.evening?.workType === "lump" ? "مقطوع" : r.evening ? "پایه" : "", r.evening?.quality ? "تأیید" : "",
        Number(r.evening?.bonus) || 0,
        syncLabel(r),
      ],
    },
    machinery: {
      name: "ماشین‌آلات",
      header: ["تاریخ", "ماشین", "راننده", "ساعت‌کار شروع", "ساعت‌کار پایان", "ساعات کارکرد مفید", "رویداد", "جزئیات", "هزینه/مصرف", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.machine, r.driver, r.start, r.end, r.usefulHours, r.category, r.details, r.cost, syncLabel(r)],
    },
    irrigation: {
      name: "آبیاری",
      header: irrigationHeader,
      row: (r) => [r.date, r.worker, r.count, ...r.state, syncLabel(r)],
    },
    spray: {
      name: "کود و سم",
      header: ["تاریخ", "باغ", "عملیات", "کود/سم", "دوز", "آفت/هدف", "اپراتور", "توضیحات", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.garden, r.op, r.material, r.dose, r.target, r.operator, r.note, syncLabel(r)],
    },
    orchard: {
      name: "امورات باغی",
      header: ["تاریخ", "باغ", "نوع کار", "کارگر", "تعداد/مقدار", "وضعیت", "توضیحات", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.garden, r.task, r.worker, Number(r.count) || "", r.status, r.note, syncLabel(r)],
    },
    inventory: {
      name: "انبار",
      header: ["تاریخ", "کالا", "نوع تراکنش", "مقدار", "واحد", "طرف", "توضیحات", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.item, r.type, Number(r.qty) || 0, r.unit, r.party, r.desc, syncLabel(r)],
    },
    accounting: {
      name: "حسابداری",
      header: ["تاریخ", "نوع", "دسته", "شرح", "طرف حساب", "مبلغ (تومان)", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.type, r.category, r.desc, r.party, Number(r.amount) || 0, syncLabel(r)],
    },
    harvest: {
      name: "برداشت و فروش",
      header: ["تاریخ", "محصول", "برداشت (kg)", "فروش (kg)", "قیمت واحد", "مبلغ کل", "خریدار", "توضیحات", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.product, Number(r.harvested) || 0, Number(r.sold) || 0, Number(r.price) || 0, (Number(r.sold) || 0) * (Number(r.price) || 0), r.buyer, r.note, syncLabel(r)],
    },
    sheep: {
      name: "دامداری",
      header: ["تاریخ", "دسته‌بندی", "تعداد", "مبلغ (تومان)", "مسئول", "توضیحات", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.category, Number(r.count) || 0, Number(r.amount) || 0, r.person, r.desc, syncLabel(r)],
    },
    security: {
      name: "امنیت و تردد",
      header: ["تاریخ", "نوع حادثه", "عنوان", "شرح", "شناسایی افراد", "اقدام انجام‌شده", "گزارش‌دهنده", "وضعیت همگام‌سازی"],
      row: (r) => [r.date, r.type, r.title, r.desc, r.identified, r.action, r.reporter, syncLabel(r)],
    },
  };
}

export async function exportConsolidatedExcel(data: AllModulesData, range: Range | null, filenameSuffix: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "سامانه مدیریت مزرعه حسین‌آباد شهکل";
  const filt = <T extends { date: string }>(arr: T[]) => (range ? byRange(arr, range) : arr);
  const d = defs();

  (Object.keys(d) as (keyof AllModulesData)[]).forEach((key) => {
    const def = d[key];
    const rows = filt(data[key] as { date: string }[]) as never[];
    const ws = wb.addWorksheet(def.name, { views: [{ rightToLeft: true }] });
    ws.addRow(def.header);
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF573B23" } };
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });
    rows.forEach((r) => ws.addRow(def.row(r)));
    ws.columns.forEach((col) => {
      let max = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        max = Math.max(max, String(cell.value ?? "").length + 2);
      });
      col.width = Math.min(60, max);
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Farm_Full_Report_${filenameSuffix}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
