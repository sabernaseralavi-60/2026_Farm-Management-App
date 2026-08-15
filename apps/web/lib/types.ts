export type ModuleKey =
  | "attendance"
  | "machinery"
  | "irrigation"
  | "pest_fertilizer"
  | "orchard"
  | "inventory"
  | "accounting"
  | "harvest"
  | "sheep"
  | "security";

export interface Synced {
  uid: string;
  synced: boolean;
}

export type WorkType = "base" | "lump";

export interface ShiftEntry {
  in: string;
  out: string;
  workType: WorkType;
  desc: string;
  quality: boolean;
  bonus: number | "";
}

export type AttendanceStatus = "present" | "leave";
export type LeaveType = "paid" | "unpaid";

export interface AttendanceRecord extends Synced {
  date: string;
  worker: string;
  status: AttendanceStatus;
  leaveType?: LeaveType;
  morning?: ShiftEntry;
  evening?: ShiftEntry;
}

export interface MachineryRecord extends Synced {
  date: string;
  machine: string;
  driver: string;
  start: number | "";
  end: number | "";
  usefulHours: number | "";
  category: string;
  details: string;
  cost: string;
}

export interface IrrigationRecord extends Synced {
  date: string;
  worker: string;
  /** Garden numbers (1..IRRIGATION_GARDEN_TOTAL) currently under irrigation this day. */
  gardens: number[];
  count: number;
}

export interface PestFertilizerRecord extends Synced {
  date: string;
  garden: string;
  op: string;
  material: string;
  dose: string;
  target: string;
  operator: string;
  note: string;
}

export type OrchardStatus = "انجام شد" | "در حال انجام" | "برنامه‌ریزی شده";

export interface OrchardRecord extends Synced {
  date: string;
  garden: string;
  task: string;
  worker: string;
  count: number | "";
  status: OrchardStatus;
  note: string;
}

export type InventoryType = "ورود" | "خروج";

export interface InventoryRecord extends Synced {
  date: string;
  item: string;
  type: InventoryType;
  qty: number | "";
  unit: string;
  party: string;
  desc: string;
}

export type AccountingType = "درآمد" | "هزینه";

export interface AccountingRecord extends Synced {
  date: string;
  type: AccountingType;
  category: string;
  amount: number | "";
  party: string;
  desc: string;
}

export interface HarvestRecord extends Synced {
  date: string;
  product: string;
  harvested: number | "";
  sold: number | "";
  price: number | "";
  buyer: string;
  note: string;
}

export interface SheepRecord extends Synced {
  date: string;
  category: string;
  count: number | "";
  amount: number | "";
  person: string;
  desc: string;
}

export interface SecurityRecord extends Synced {
  date: string;
  type: string;
  title: string;
  desc: string;
  identified: string;
  action: string;
  reporter: string;
}

export type AnyRecord =
  | AttendanceRecord
  | MachineryRecord
  | IrrigationRecord
  | PestFertilizerRecord
  | OrchardRecord
  | InventoryRecord
  | AccountingRecord
  | HarvestRecord
  | SheepRecord
  | SecurityRecord;
