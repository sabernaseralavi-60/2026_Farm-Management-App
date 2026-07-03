import Dexie, { type Table } from "dexie";
import type {
  AccountingRecord,
  AnyRecord,
  AttendanceRecord,
  HarvestRecord,
  InventoryRecord,
  IrrigationRecord,
  MachineryRecord,
  ModuleKey,
  OrchardRecord,
  PestFertilizerRecord,
  SecurityRecord,
  SheepRecord,
} from "./types";

// Local-first store: IndexedDB (via Dexie) is the single source of truth on
// the device. Nothing here is ever deleted because a server sync failed or
// hasn't happened yet — that is the "Zero Data Loss" guarantee. A record is
// only ever removed when the user explicitly deletes it (dbDelete below).
export class FarmDatabase extends Dexie {
  attendance!: Table<AttendanceRecord, string>;
  machinery!: Table<MachineryRecord, string>;
  irrigation!: Table<IrrigationRecord, string>;
  pest_fertilizer!: Table<PestFertilizerRecord, string>;
  orchard!: Table<OrchardRecord, string>;
  inventory!: Table<InventoryRecord, string>;
  accounting!: Table<AccountingRecord, string>;
  harvest!: Table<HarvestRecord, string>;
  sheep!: Table<SheepRecord, string>;
  security!: Table<SecurityRecord, string>;

  constructor() {
    super("FarmDatabaseV2");
    // Note: `synced` is intentionally NOT indexed — it holds a boolean, and
    // booleans are not valid IndexedDB key types (such an index would just
    // silently never match). Pending-sync counts are computed by filtering
    // an in-memory `toArray()` instead (see lib/store.ts).
    this.version(1).stores({
      attendance: "uid, date, worker",
      machinery: "uid, date, machine",
      irrigation: "uid, date",
      pest_fertilizer: "uid, date, garden",
      orchard: "uid, date, garden",
      inventory: "uid, date, item",
      accounting: "uid, date, type",
      harvest: "uid, date, product",
      sheep: "uid, date, category",
      security: "uid, date, type",
    });
  }
}

export const db = new FarmDatabase();

export const MODULE_KEYS: ModuleKey[] = [
  "attendance",
  "machinery",
  "irrigation",
  "pest_fertilizer",
  "orchard",
  "inventory",
  "accounting",
  "harvest",
  "sheep",
  "security",
];

export function tableFor(moduleKey: ModuleKey): Table<AnyRecord, string> {
  return db[moduleKey] as unknown as Table<AnyRecord, string>;
}
