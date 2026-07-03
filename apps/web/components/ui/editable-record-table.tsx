"use client";

import type { ReactNode } from "react";
import type { Synced } from "@/lib/types";
import { SyncBadge } from "./badge";

export interface RecordColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface Props<T extends Synced> {
  columns: RecordColumn<T>[];
  rows: T[];
  emptyText: string;
  onEdit: (row: T) => void;
  onDelete: (uid: string) => void;
  deleteConfirmText?: string;
}

export function EditableRecordTable<T extends Synced>({
  columns,
  rows,
  emptyText,
  onEdit,
  onDelete,
  deleteConfirmText = "این رکورد حذف شود؟",
}: Props<T>) {
  if (rows.length === 0) {
    return <div className="py-10 text-center text-fluid-sm text-bark-500">{emptyText}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full text-right text-fluid-sm">
        <thead className="bg-bark-700 text-white">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-bold">
                {c.label}
              </th>
            ))}
            <th className="px-4 py-3 font-bold">همگام‌سازی</th>
            <th className="px-4 py-3 font-bold">عملیات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-200">
          {rows.map((row) => (
            <tr key={row.uid}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} className={c.className ?? "px-4 py-3"}>
                  {c.render(row)}
                </td>
              ))}
              <td data-label="همگام‌سازی" className="px-4 py-3">
                <SyncBadge synced={row.synced} />
              </td>
              <td data-label="عملیات" className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="font-semibold text-water-700 hover:text-water-600"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(deleteConfirmText)) onDelete(row.uid);
                    }}
                    className="font-semibold text-red-500 hover:text-red-700"
                  >
                    🗑 حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
