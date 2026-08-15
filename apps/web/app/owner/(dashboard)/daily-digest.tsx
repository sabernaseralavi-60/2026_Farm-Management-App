"use client";

import { money, toFa } from "@/lib/jalaali";
import { KpiCard } from "./owner-charts";

interface ShiftLike {
  in: string | null;
  out: string | null;
  quality: boolean | null;
  bonus: number | null;
}

interface AttendanceRow {
  worker: string;
  status: string;
  leaveType: string | null;
  morningIn: string | null;
  morningOut: string | null;
  morningOk: boolean | null;
  morningBonus: number | null;
  eveningIn: string | null;
  eveningOut: string | null;
  eveningOk: boolean | null;
  eveningBonus: number | null;
}

export interface DayData {
  date: string;
  kpis: {
    workersPresent: number;
    workersOnLeave: number;
    machineHours: number;
    irrigationCoverage: number | null;
    income: number;
    expense: number;
    harvestedKg: number;
    securityIncidents: number;
  };
  attendance: AttendanceRow[];
  machinery: { machine: string; driver: string | null; usefulHours: number | null; category: string; cost: string | null }[];
  irrigation: { worker: string | null; count: number } | null;
  spray: { garden: string; op: string; material: string | null; operator: string | null }[];
  orchard: { garden: string; task: string; worker: string | null; status: string }[];
  inventory: { item: string; type: string; qty: number; unit: string }[];
  accounting: { type: string; category: string; amount: number; party: string | null; desc: string | null }[];
  harvest: { product: string; harvested: number | null; sold: number | null; price: number | null; buyer: string | null }[];
  sheep: { category: string; count: number; person: string | null }[];
  security: { type: string; title: string; action: string | null }[];
}

function Section({ icon, title, empty, children }: { icon: string; title: string; empty: boolean; children: React.ReactNode }) {
  if (empty) return null;
  return (
    <div className="glass rounded-2xl p-5">
      <h4 className="mb-3 flex items-center gap-2 font-bold text-bark-700">
        <span aria-hidden>{icon}</span> {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand-50 px-3 py-2 text-fluid-sm">{children}</div>;
}

function shiftText(s: ShiftLike) {
  if (!s.in && !s.out) return null;
  return `${toFa(s.in ?? "—")}–${toFa(s.out ?? "—")}${s.quality ? " ✅" : ""}${Number(s.bonus) ? ` · ${toFa(s.bonus)} ت` : ""}`;
}

export function DailyDigest({ data }: { data: DayData }) {
  const { kpis } = data;
  const hasAnyData =
    data.attendance.length ||
    data.machinery.length ||
    data.irrigation ||
    data.spray.length ||
    data.orchard.length ||
    data.inventory.length ||
    data.accounting.length ||
    data.harvest.length ||
    data.sheep.length ||
    data.security.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard icon="👷" label="کارگران حاضر" value={toFa(kpis.workersPresent)} tone="#059669" />
        <KpiCard icon="🌤️" label="در مرخصی" value={toFa(kpis.workersOnLeave)} tone="#d97706" />
        <KpiCard icon="🚜" label="ساعات مؤثر ماشین‌آلات" value={toFa(kpis.machineHours)} tone="#7a5736" />
        <KpiCard icon="💧" label="پوشش آبیاری" value={kpis.irrigationCoverage === null ? "—" : `${toFa(kpis.irrigationCoverage)}٪`} tone="#0284c7" />
        <KpiCard icon="💵" label="درآمد روز" value={`${money(kpis.income)} ت`} tone="#059669" />
        <KpiCard icon="🧾" label="هزینه روز" value={`${money(kpis.expense)} ت`} tone="#dc2626" />
        <KpiCard icon="🌾" label="برداشت روز" value={`${toFa(kpis.harvestedKg)} kg`} tone="#d97706" />
        <KpiCard icon="🛡️" label="حوادث امنیتی" value={toFa(kpis.securityIncidents)} tone="#475569" />
      </div>

      {!hasAnyData && (
        <div className="glass rounded-2xl p-10 text-center text-fluid-sm text-bark-400">هیچ داده‌ای برای این روز ثبت نشده است.</div>
      )}

      <Section icon="👷" title="حضور و غیاب" empty={data.attendance.length === 0}>
        {data.attendance.map((r, i) => {
          const morning = shiftText({ in: r.morningIn, out: r.morningOut, quality: r.morningOk, bonus: r.morningBonus });
          const evening = shiftText({ in: r.eveningIn, out: r.eveningOut, quality: r.eveningOk, bonus: r.eveningBonus });
          return (
            <Row key={i}>
              <span className="font-semibold">{r.worker}</span>
              {r.status === "leave" ? (
                <span className="text-gold-700">مرخصی {r.leaveType === "unpaid" ? "(بدون حقوق)" : "(با حقوق)"}</span>
              ) : (
                <span className="text-bark-600">
                  {morning && (
                    <>
                      🌅 <bdi dir="ltr">{morning}</bdi>{" "}
                    </>
                  )}
                  {evening && (
                    <>
                      🌇 <bdi dir="ltr">{evening}</bdi>
                    </>
                  )}
                </span>
              )}
            </Row>
          );
        })}
      </Section>

      <Section icon="🚜" title="ماشین‌آلات" empty={data.machinery.length === 0}>
        {data.machinery.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.machine}</span>
            <span className="text-bark-600">
              {r.category} {r.driver ? `· ${r.driver}` : ""} {r.usefulHours ? `· ${toFa(r.usefulHours)} ساعت` : ""}
            </span>
          </Row>
        ))}
      </Section>

      {data.irrigation && (
        <Section icon="💧" title="آبیاری" empty={false}>
          <Row>
            <span className="font-semibold">{data.irrigation.worker || "—"}</span>
            <span className="text-water-700">{toFa(data.irrigation.count)} / ۴۳ باغ</span>
          </Row>
        </Section>
      )}

      <Section icon="🌿" title="کود و سم" empty={data.spray.length === 0}>
        {data.spray.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.garden}</span>
            <span className="text-bark-600">{r.op} {r.material ? `· ${r.material}` : ""} {r.operator ? `· ${r.operator}` : ""}</span>
          </Row>
        ))}
      </Section>

      <Section icon="🌳" title="امورات باغی" empty={data.orchard.length === 0}>
        {data.orchard.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.garden}</span>
            <span className="text-bark-600">{r.task} {r.worker ? `· ${r.worker}` : ""} · {r.status}</span>
          </Row>
        ))}
      </Section>

      <Section icon="📦" title="انبار" empty={data.inventory.length === 0}>
        {data.inventory.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.item}</span>
            <span className={r.type === "ورود" ? "text-leaf-700" : "text-red-600"}>
              {r.type === "ورود" ? "📥" : "📤"} {toFa(r.qty)} {r.unit}
            </span>
          </Row>
        ))}
      </Section>

      <Section icon="💰" title="حسابداری" empty={data.accounting.length === 0}>
        {data.accounting.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.category}{r.desc ? ` — ${r.desc}` : ""}</span>
            <span className={r.type === "درآمد" ? "text-leaf-700" : "text-red-600"}>{money(r.amount)} ت</span>
          </Row>
        ))}
      </Section>

      <Section icon="🌾" title="برداشت و فروش" empty={data.harvest.length === 0}>
        {data.harvest.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.product}</span>
            <span className="text-bark-600">
              {r.harvested ? `برداشت ${toFa(r.harvested)}kg` : ""} {r.sold ? `· فروش ${toFa(r.sold)}kg` : ""} {r.buyer ? `· ${r.buyer}` : ""}
            </span>
          </Row>
        ))}
      </Section>

      <Section icon="🐑" title="پرورش گوسفند" empty={data.sheep.length === 0}>
        {data.sheep.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.category}</span>
            <span className="text-bark-600">{toFa(r.count)} رأس {r.person ? `· ${r.person}` : ""}</span>
          </Row>
        ))}
      </Section>

      <Section icon="🛡️" title="امنیت و تردد" empty={data.security.length === 0}>
        {data.security.map((r, i) => (
          <Row key={i}>
            <span className="font-semibold">{r.title}</span>
            <span className="text-bark-600">{r.type} {r.action ? `· ${r.action}` : ""}</span>
          </Row>
        ))}
      </Section>
    </div>
  );
}
