"use client"

import { useT } from "@ihsp/i18n"
import type { TargetView } from "../utils/planner-view"
import { PairsTable } from "./pairs-table"

/** What a target asks for, in one sentence (and the table of finals when both kinds of control are left). */
export function TargetAdvice({ view }: { view: TargetView }) {
  const t = useT("planner.target")
  switch (view.kind) {
    case "secured":
      return <p className="text-sm">{t("secured")}</p>
    case "not_reachable":
      return <p className="text-sm">{t("notReachable")}</p>
    case "unknown":
      return <p className="text-sm">{t("unknown")}</p>
    case "single":
      return (
        <p className="text-sm">
          {view.control === "midterm"
            ? t("midterm", { value: view.value, count: view.count })
            : t("final", { value: view.value })}
        </p>
      )
    case "both":
      return (
        <div className="flex flex-col gap-2">
          {view.minBoth === null ? null : <p className="text-sm">{t("both", { value: view.minBoth })}</p>}
          {view.pairs.length === 0 ? null : <PairsTable pairs={view.pairs} />}
        </div>
      )
  }
}
