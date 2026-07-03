import { z } from "zod";
import type { ModuleKey } from "./types";

const shiftSchema = z
  .object({
    in: z.string(),
    out: z.string(),
    workType: z.enum(["base", "lump"]),
    desc: z.string(),
    quality: z.boolean(),
    bonus: z.union([z.number(), z.literal("")]),
  })
  .optional();

const attendanceSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  worker: z.string().min(1),
  status: z.enum(["present", "leave"]),
  leaveType: z.enum(["paid", "unpaid"]).optional(),
  morning: shiftSchema,
  evening: shiftSchema,
});

const machinerySchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  machine: z.string().min(1),
  driver: z.string().optional().default(""),
  start: z.union([z.number(), z.literal("")]),
  end: z.union([z.number(), z.literal("")]),
  usefulHours: z.union([z.number(), z.literal("")]),
  category: z.string(),
  details: z.string().optional().default(""),
  cost: z.string().optional().default(""),
});

const irrigationSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  worker: z.string().optional().default(""),
  state: z.array(z.number()),
  count: z.number(),
});

const pestFertilizerSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  garden: z.string(),
  op: z.string(),
  material: z.string().optional().default(""),
  dose: z.string().optional().default(""),
  target: z.string().optional().default(""),
  operator: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

const orchardSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  garden: z.string(),
  task: z.string(),
  worker: z.string().optional().default(""),
  count: z.union([z.number(), z.literal("")]),
  status: z.string(),
  note: z.string().optional().default(""),
});

const inventorySchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  item: z.string().min(1),
  type: z.enum(["ورود", "خروج"]),
  qty: z.union([z.number(), z.literal("")]),
  unit: z.string(),
  party: z.string().optional().default(""),
  desc: z.string().optional().default(""),
});

const accountingSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  type: z.enum(["درآمد", "هزینه"]),
  category: z.string(),
  amount: z.union([z.number(), z.literal("")]),
  party: z.string().optional().default(""),
  desc: z.string().optional().default(""),
});

const harvestSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  product: z.string(),
  harvested: z.union([z.number(), z.literal("")]),
  sold: z.union([z.number(), z.literal("")]),
  price: z.union([z.number(), z.literal("")]),
  buyer: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

const sheepSchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  category: z.string(),
  count: z.union([z.number(), z.literal("")]),
  amount: z.union([z.number(), z.literal("")]),
  person: z.string().optional().default(""),
  desc: z.string().optional().default(""),
});

const securitySchema = z.object({
  uid: z.string().min(1),
  date: z.string().min(1),
  type: z.string(),
  title: z.string(),
  desc: z.string().optional().default(""),
  identified: z.string().optional().default(""),
  action: z.string().optional().default(""),
  reporter: z.string().optional().default(""),
});

export const SYNC_SCHEMAS = {
  attendance: attendanceSchema,
  machinery: machinerySchema,
  irrigation: irrigationSchema,
  pest_fertilizer: pestFertilizerSchema,
  orchard: orchardSchema,
  inventory: inventorySchema,
  accounting: accountingSchema,
  harvest: harvestSchema,
  sheep: sheepSchema,
  security: securitySchema,
} satisfies Record<ModuleKey, z.ZodTypeAny>;

const n = (v: number | "" | undefined) => (v === "" || v === undefined ? null : v);

/** Maps a validated client record onto the flat columns Prisma expects
 * (Prisma models don't nest the attendance morning/evening shift objects). */
export function toPrismaData(module: ModuleKey, data: Record<string, unknown>) {
  switch (module) {
    case "attendance": {
      const d = data as z.infer<typeof attendanceSchema>;
      return {
        date: d.date,
        worker: d.worker,
        status: d.status,
        leaveType: d.leaveType ?? null,
        morningIn: d.morning?.in ?? null,
        morningOut: d.morning?.out ?? null,
        morningType: d.morning?.workType ?? null,
        morningDesc: d.morning?.desc ?? null,
        morningOk: d.morning?.quality ?? null,
        morningBonus: n(d.morning?.bonus),
        eveningIn: d.evening?.in ?? null,
        eveningOut: d.evening?.out ?? null,
        eveningType: d.evening?.workType ?? null,
        eveningDesc: d.evening?.desc ?? null,
        eveningOk: d.evening?.quality ?? null,
        eveningBonus: n(d.evening?.bonus),
      };
    }
    case "machinery": {
      const d = data as z.infer<typeof machinerySchema>;
      return {
        date: d.date,
        machine: d.machine,
        driver: d.driver,
        start: n(d.start),
        end: n(d.end),
        usefulHours: n(d.usefulHours),
        category: d.category,
        details: d.details,
        cost: d.cost,
      };
    }
    case "irrigation": {
      const d = data as z.infer<typeof irrigationSchema>;
      return { date: d.date, worker: d.worker, state: d.state, count: d.count };
    }
    case "pest_fertilizer": {
      const d = data as z.infer<typeof pestFertilizerSchema>;
      return {
        date: d.date,
        garden: d.garden,
        op: d.op,
        material: d.material,
        dose: d.dose,
        target: d.target,
        operator: d.operator,
        note: d.note,
      };
    }
    case "orchard": {
      const d = data as z.infer<typeof orchardSchema>;
      return {
        date: d.date,
        garden: d.garden,
        task: d.task,
        worker: d.worker,
        count: n(d.count),
        status: d.status,
        note: d.note,
      };
    }
    case "inventory": {
      const d = data as z.infer<typeof inventorySchema>;
      return {
        date: d.date,
        item: d.item,
        type: d.type,
        qty: n(d.qty) ?? 0,
        unit: d.unit,
        party: d.party,
        desc: d.desc,
      };
    }
    case "accounting": {
      const d = data as z.infer<typeof accountingSchema>;
      return {
        date: d.date,
        type: d.type,
        category: d.category,
        amount: n(d.amount) ?? 0,
        party: d.party,
        desc: d.desc,
      };
    }
    case "harvest": {
      const d = data as z.infer<typeof harvestSchema>;
      return {
        date: d.date,
        product: d.product,
        harvested: n(d.harvested),
        sold: n(d.sold),
        price: n(d.price),
        buyer: d.buyer,
        note: d.note,
      };
    }
    case "sheep": {
      const d = data as z.infer<typeof sheepSchema>;
      return {
        date: d.date,
        category: d.category,
        count: n(d.count) ?? 0,
        amount: n(d.amount),
        person: d.person,
        desc: d.desc,
      };
    }
    case "security": {
      const d = data as z.infer<typeof securitySchema>;
      return {
        date: d.date,
        type: d.type,
        title: d.title,
        desc: d.desc,
        identified: d.identified,
        action: d.action,
        reporter: d.reporter,
      };
    }
  }
}
