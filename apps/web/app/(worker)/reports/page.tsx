"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldWrap, Select, TextInput } from "@/components/ui/fields";
import { GlassCard } from "@/components/ui/glass-card";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ModuleHero } from "@/components/ui/module-hero";
import { backupJSON, clearAllData, restoreJSON } from "@/lib/backup";
import { exportConsolidatedExcel } from "@/lib/excel";
import { numFa, toFa, todayJStr } from "@/lib/jalaali";
import { findModuleMeta } from "@/lib/module-meta";
import { MACHINES } from "@/lib/reference-data";
import { attendanceQuery, buildManagementReport, machineryQuery, periodRange, type AllModulesData, type Period } from "@/lib/report";
import { pendingSyncCount, useModuleStore } from "@/lib/store";
import { syncPendingAll } from "@/lib/sync";
import type {
  AccountingRecord,
  AttendanceRecord,
  HarvestRecord,
  InventoryRecord,
  IrrigationRecord,
  MachineryRecord,
  OrchardRecord,
  PestFertilizerRecord,
  SecurityRecord,
  SheepRecord,
} from "@/lib/types";

const meta = findModuleMeta("reports")!;

export default function ReportsPage() {
  const attendance = useModuleStore<AttendanceRecord>("attendance")();
  const machinery = useModuleStore<MachineryRecord>("machinery")();
  const irrigation = useModuleStore<IrrigationRecord>("irrigation")();
  const spray = useModuleStore<PestFertilizerRecord>("pest_fertilizer")();
  const orchard = useModuleStore<OrchardRecord>("orchard")();
  const inventory = useModuleStore<InventoryRecord>("inventory")();
  const accounting = useModuleStore<AccountingRecord>("accounting")();
  const harvest = useModuleStore<HarvestRecord>("harvest")();
  const sheep = useModuleStore<SheepRecord>("sheep")();
  const security = useModuleStore<SecurityRecord>("security")();

  const stores = [attendance, machinery, irrigation, spray, orchard, inventory, accounting, harvest, sheep, security];

  useEffect(() => {
    stores.forEach((s) => {
      if (!s.loaded) void s.load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data: AllModulesData = useMemo(
    () => ({
      attendance: attendance.rows,
      machinery: machinery.rows,
      irrigation: irrigation.rows,
      spray: spray.rows,
      orchard: orchard.rows,
      inventory: inventory.rows,
      accounting: accounting.rows,
      harvest: harvest.rows,
      sheep: sheep.rows,
      security: security.rows,
    }),
    [attendance.rows, machinery.rows, irrigation.rows, spray.rows, orchard.rows, inventory.rows, accounting.rows, harvest.rows, sheep.rows, security.rows],
  );

  const [period, setPeriod] = useState<Period>("daily");
  const [repDate, setRepDate] = useState(todayJStr());
  const [reportText, setReportText] = useState("");

  function generateReport() {
    if (!repDate) return alert("تاریخ مرجع گزارش را انتخاب کنید.");
    setReportText(buildManagementReport(period, repDate, data));
  }

  function copyReport() {
    if (!reportText.trim()) return alert("ابتدا گزارش را تولید کنید.");
    navigator.clipboard?.writeText(reportText).catch(() => {});
  }
  function shareWhatsApp() {
    if (!reportText.trim()) return alert("ابتدا گزارش را تولید کنید.");
    window.open("https://wa.me/?text=" + encodeURIComponent(reportText), "_blank");
  }
  function shareTelegram() {
    if (!reportText.trim()) return alert("ابتدا گزارش را تولید کنید.");
    window.open("https://t.me/share/url?url=%20&text=" + encodeURIComponent(reportText), "_blank");
  }
  function downloadReportTxt() {
    if (!reportText.trim()) return alert("ابتدا گزارش را تولید کنید.");
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Farm_Report_" + repDate.replace(/\//g, "-") + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ===== Query center =====
  const [qAttWorker, setQAttWorker] = useState("");
  const [qAttFrom, setQAttFrom] = useState("");
  const [qAttTo, setQAttTo] = useState("");
  const [qAttNoFri, setQAttNoFri] = useState(false);
  const [attResult, setAttResult] = useState<ReturnType<typeof attendanceQuery> | null>(null);

  function runAttendanceQuery() {
    if (!qAttWorker.trim() || !qAttFrom || !qAttTo) return alert("نام کارگر و بازه تاریخ را کامل وارد کنید.");
    setAttResult(attendanceQuery(attendance.rows, qAttWorker.trim(), qAttFrom, qAttTo, qAttNoFri));
  }

  const [qMachName, setQMachName] = useState(MACHINES[0]);
  const [qMachFrom, setQMachFrom] = useState("");
  const [qMachTo, setQMachTo] = useState("");
  const [machResult, setMachResult] = useState<ReturnType<typeof machineryQuery> | null>(null);

  function runMachineryQuery() {
    if (!qMachFrom || !qMachTo) return alert("نام ماشین و بازه تاریخ را کامل وارد کنید.");
    setMachResult(machineryQuery(machinery.rows, qMachName, qMachFrom, qMachTo));
  }

  // ===== Cloud sync panel =====
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    void pendingSyncCount().then(setPending);
  }, [data]);

  async function onSyncNow() {
    setSyncing(true);
    const res = await syncPendingAll();
    setSyncing(false);
    setPending(await pendingSyncCount());
    alert(`${toFa(res.done)} رکورد همگام‌سازی شد${res.fail ? `، ${toFa(res.fail)} مورد ناموفق` : ""}.`);
  }

  // ===== Excel export =====
  const [exportScope, setExportScope] = useState<"all" | "period">("all");
  async function onExportExcel() {
    const range = exportScope === "period" ? periodRange(period, repDate) : null;
    if (exportScope === "period" && !repDate) return alert("برای خروجی بازه‌ای، تاریخ مرجع گزارش را انتخاب کنید.");
    await exportConsolidatedExcel(data, range, exportScope === "period" ? repDate.replace(/\//g, "-") : "AllTime");
  }

  // ===== Backup / restore / clear =====
  const fileInputRef = useRef<HTMLInputElement>(null);
  async function onRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await restoreJSON(file);
      stores.forEach((s) => void s.load());
      alert("داده‌ها از فایل پشتیبان بازیابی شد.");
    } catch {
      alert("فایل پشتیبان نامعتبر است.");
    } finally {
      e.target.value = "";
    }
  }
  async function onClearAll() {
    if (!confirm("همه داده‌های ذخیره‌شده پاک شود؟ این عمل قابل بازگشت نیست.")) return;
    await clearAllData();
    stores.forEach((s) => void s.load());
    alert("همه داده‌ها پاک شد.");
  }

  return (
    <section className="animate-fade-in-up space-y-6">
      <ModuleHero icon={meta.icon} title={meta.title} subtitle={meta.subtitle} from={meta.from} to={meta.to} />

      <GlassCard>
        <p className="mb-4 text-fluid-sm text-bark-500">
          دوره و تاریخ مرجع را انتخاب کنید؛ سامانه اطلاعات همه‌ی دفاتر را در آن بازه جمع‌بندی کرده و یک متن گزارشِ آماده برای ارسال به مدیریت تولید می‌کند.
        </p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <FieldWrap label="دوره گزارش">
            <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهیانه</option>
              <option value="yearly">سالیانه</option>
            </Select>
          </FieldWrap>
          <FieldWrap label="تاریخ مرجع">
            <JalaliDatePicker value={repDate} onChange={setRepDate} />
          </FieldWrap>
          <Button variant="brown" onClick={generateReport}>
            ⚙️ تولید گزارش
          </Button>
        </div>
        <textarea
          readOnly
          rows={16}
          value={reportText}
          placeholder="متن گزارش پس از تولید اینجا نمایش داده می‌شود..."
          className="w-full rounded-2xl border border-sand-300 bg-sand-50 p-4 text-fluid-sm leading-8 outline-none focus:ring-2 focus:ring-leaf-500"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="brown" onClick={copyReport}>📋 کپی متن</Button>
          <Button style={{ background: "#25D366" }} className="text-white" onClick={shareWhatsApp}>💬 واتس‌اپ</Button>
          <Button style={{ background: "#229ED9" }} className="text-white" onClick={shareTelegram}>✈️ تلگرام</Button>
          <Button variant="soft" onClick={downloadReportTxt}>⬇️ دانلود متن</Button>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-bark-700">🔍 مرکز استعلامات و آنالیز پویا</h3>
        <p className="mb-4 text-fluid-sm text-bark-500">استعلام دقیق حضور/غیبت کارگران و کارکرد ماشین‌آلات در هر بازه دلخواه.</p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-sand-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-leaf-700">👤 استعلام حضور و غیبت کارگر</h4>
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldWrap label="نام کارگر" className="sm:col-span-2">
                <TextInput list="workers-list" value={qAttWorker} onChange={(e) => setQAttWorker(e.target.value)} placeholder="انتخاب یا تایپ نام کارگر" />
              </FieldWrap>
              <FieldWrap label="از تاریخ">
                <JalaliDatePicker value={qAttFrom} onChange={setQAttFrom} placeholder="از تاریخ" />
              </FieldWrap>
              <FieldWrap label="تا تاریخ">
                <JalaliDatePicker value={qAttTo} onChange={setQAttTo} placeholder="تا تاریخ" />
              </FieldWrap>
              <label className="flex cursor-pointer items-center gap-2 text-fluid-sm sm:col-span-2">
                <input type="checkbox" checked={qAttNoFri} onChange={(e) => setQAttNoFri(e.target.checked)} className="h-5 w-5 accent-leaf-600" />
                عدم احتساب روزهای جمعه از غیبت
              </label>
            </div>
            <Button onClick={runAttendanceQuery}>🔎 اجرای استعلام</Button>
            {attResult && (
              <div className="mt-4">
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-leaf-500/30 bg-leaf-500/10 p-3">
                    <div className="text-xs font-semibold text-leaf-700">✅ روزهای حضور</div>
                    <div className="text-fluid-lg font-extrabold text-leaf-700">{toFa(attResult.present.length)}</div>
                  </div>
                  <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3">
                    <div className="text-xs font-semibold text-gold-700">🌤 روزهای مرخصی</div>
                    <div className="text-fluid-lg font-extrabold text-gold-700">{toFa(attResult.leave.length)}</div>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <div className="text-xs font-semibold text-red-600">❌ غیبت برآوردی</div>
                    <div className="text-fluid-lg font-extrabold text-red-600">{toFa(attResult.absent.length)}</div>
                  </div>
                </div>
                <div className="mb-3 grid grid-cols-1 gap-2 text-fluid-sm sm:grid-cols-2">
                  <div><b>مجموع ساعات کار:</b> {toFa(attResult.hours)} ساعت</div>
                  <div><b>مجموع پاداش:</b> {toFa(attResult.bonus)} تومان</div>
                </div>
                <details className="mb-2">
                  <summary className="cursor-pointer text-fluid-sm font-semibold text-leaf-700">فهرست روزهای حضور</summary>
                  <div className="mt-2 text-xs leading-6">{attResult.present.map(toFa).join("، ") || "—"}</div>
                </details>
                <details>
                  <summary className="cursor-pointer text-fluid-sm font-semibold text-red-600">فهرست روزهای غیبت</summary>
                  <div className="mt-2 text-xs leading-6">{attResult.absent.map(toFa).join("، ") || "—"}</div>
                </details>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-sand-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-water-700">🚜 استعلام کارکرد ماشین‌آلات</h4>
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldWrap label="نام ماشین" className="sm:col-span-2">
                <Select value={qMachName} onChange={(e) => setQMachName(e.target.value)}>
                  {MACHINES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </FieldWrap>
              <FieldWrap label="از تاریخ">
                <JalaliDatePicker value={qMachFrom} onChange={setQMachFrom} placeholder="از تاریخ" />
              </FieldWrap>
              <FieldWrap label="تا تاریخ">
                <JalaliDatePicker value={qMachTo} onChange={setQMachTo} placeholder="تا تاریخ" />
              </FieldWrap>
            </div>
            <Button variant="water" onClick={runMachineryQuery}>🔎 اجرای استعلام</Button>
            {machResult && (
              <div className="mt-4">
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-water-500/30 bg-water-500/10 p-3">
                    <div className="text-xs font-semibold text-water-700">ساعات کارکرد</div>
                    <div className="text-fluid-lg font-extrabold text-water-700">{toFa(machResult.hours)}</div>
                  </div>
                  <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3">
                    <div className="text-xs font-semibold text-gold-700">لاگ سرویس/خرابی</div>
                    <div className="text-fluid-lg font-extrabold text-gold-700">{toFa(machResult.serviceCount)}</div>
                  </div>
                  <div className="rounded-xl border border-bark-700/30 bg-bark-700/10 p-3">
                    <div className="text-xs font-semibold text-bark-700">هزینه نگهداری برآوردی</div>
                    <div className="text-fluid-lg font-extrabold text-bark-700">{toFa(machResult.cost)} تومان</div>
                  </div>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-right">
                    <thead className="text-bark-500">
                      <tr><th className="py-1">تاریخ</th><th className="py-1">رویداد</th><th className="py-1">جزئیات</th><th className="py-1">هزینه</th></tr>
                    </thead>
                    <tbody>
                      {machResult.recs.length ? (
                        machResult.recs.map((r) => (
                          <tr key={r.uid}><td className="py-1">{toFa(r.date)}</td><td className="py-1">{r.category}</td><td className="py-1">{r.details || "—"}</td><td className="py-1">{r.cost || "—"}</td></tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="py-2 text-center text-bark-400">رکوردی یافت نشد.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-bark-700">☁️ همگام‌سازی ابری با بک‌اند مزرعه</h3>
        <p className="mb-4 text-fluid-sm text-bark-500">
          داده‌ها همیشه ابتدا روی همین دستگاه ذخیره می‌شوند؛ با وصل بودن اینترنت به‌صورت خودکار همگام می‌شوند، یا اینجا دستی همگام‌سازی کنید.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="water" onClick={onSyncNow} disabled={syncing}>
            {syncing ? "⏳ در حال همگام‌سازی..." : "🔄 همگام‌سازی داده‌های معلق"}
          </Button>
          <span className="text-fluid-sm text-bark-600">
            رکوردهای در انتظار همگام‌سازی: <b className="text-gold-700">{numFa(pending)}</b>
          </span>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-bark-700">📊 خروجی اکسل جامع کل مزرعه</h3>
        <p className="mb-4 text-fluid-sm text-bark-500">یک فایل اکسل شامل ۱۰ برگه (به‌تفکیک هر دفتر) تولید می‌شود.</p>
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-sand-300 bg-sand-50 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" checked={exportScope === "all"} onChange={() => setExportScope("all")} className="h-5 w-5 accent-leaf-600" /> خروجی کل تاریخچه
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" checked={exportScope === "period"} onChange={() => setExportScope("period")} className="h-5 w-5 accent-leaf-600" /> خروجی بازه زمانی انتخابی (دوره/تاریخ بالا)
          </label>
        </div>
        <Button onClick={onExportExcel}>📊 دانلود فایل اکسل جامع کل مزرعه</Button>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-2 flex items-center gap-2 font-bold text-bark-700">🗄️ مدیریت و پشتیبان‌گیری داده‌ها</h3>
        <p className="mb-4 text-fluid-sm text-bark-500">
          اطلاعات همه‌ی دفاتر به‌صورت خودکار روی همین دستگاه (IndexedDB) ذخیره می‌شود. برای انتقال به دستگاه دیگر یا نگهداری بلندمدت از فایل پشتیبان استفاده کنید.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="brown" onClick={() => backupJSON()}>💾 دانلود فایل پشتیبان</Button>
          <Button variant="green" onClick={() => fileInputRef.current?.click()}>⬆️ بازیابی از فایل</Button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={onRestore} />
          <Button variant="red" onClick={onClearAll}>🗑 پاک کردن همه</Button>
        </div>
      </GlassCard>
    </section>
  );
}
