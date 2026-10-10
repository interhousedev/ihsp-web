"use client";

import type { DashboardWidgetKind } from "@ihsp/api";
import { useT } from "@ihsp/i18n";
import { WIDGET_CATALOG } from "../widget-catalog";

/** The catalogue: one button per kind. */
export function AddWidget({
  onAdd,
}: {
  onAdd: (kind: DashboardWidgetKind) => void;
}) {
  const t = useT("today.dashboard");
  return (
    <ul
      aria-label={t("catalog")}
      className="grid grid-cols-2 gap-2 md:grid-cols-4"
    >
      {WIDGET_CATALOG.map(({ kind, icon: Icon }) => (
        <li key={kind}>
          <button
            type="button"
            onClick={() => onAdd(kind)}
            className="hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full items-center gap-2 rounded-xl border p-2 text-left text-sm outline-none focus-visible:ring-2"
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            {t(`kinds.${kind}`)}
          </button>
        </li>
      ))}
    </ul>
  );
}
