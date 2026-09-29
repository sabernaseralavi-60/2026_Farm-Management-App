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
/** A delete that happened locally but hasn't been confirmed removed on the
 * server yet — queued the same way an unsynced create/update is, so a
 * delete made while offline still reaches the server once connectivity
 * returns (see lib/sync.ts). Keyed by `${module}:${uid}` so retrying an
 * already-flushed delete is a harmless no-op. */
export interface PendingDelete {
  id: string;
  module: ModuleKey;
  uid: string;
}

/** A compressed photo (see lib/image-compress.ts) waiting to reach Vercel
 * Blob — kept locally so it survives an offline gap or an app reload the
 * same way an unsynced record does. Once uploaded, its URL is appended to
 * the owning record's `photos` and this row is removed (see
 * lib/photo-upload.ts). `uid` links it to a record that may not have
 * reached the server yet either — that's fine, the record's own sync is
 * independent and idempotent. */
export interface PendingPhoto {
  id: string;
  module: ModuleKey;
  uid: string;
  blob: Blob;
  mime: string;
  createdAt: number;
  /** Set once the bytes reach Vercel Blob. A photo can be uploaded before
   * its owning record has ever been saved (the record is only created when
   * the form is submitted) — when that happens this is filled in but the
   * row stays queued, so lib/photo-upload.ts's retry sweep only has to
   * attach the URL to the record, never re-upload the bytes. */
  uploadedUrl?: string;
}

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
  pendingDeletes!: Table<PendingDelete, string>;
  pendingPhotos!: Table<PendingPhoto, string>;

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
    // v2: track deletes that still need to reach the server (see
    // PendingDelete above) — a plain `db[module].delete(uid)` never told
    // the backend, so a "deleted" record lived forever in Postgres.
    this.version(2).stores({
      pendingDeletes: "id, module",
    });
    // v3: queue for compressed photos waiting to reach Vercel Blob (see
    // PendingPhoto above) — same "never lose it, retry later" guarantee
    // pendingDeletes gives deletes.
    this.version(3).stores({
      pendingPhotos: "id, module, uid",
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
