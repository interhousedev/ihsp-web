"use client"

import type { VersionItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

/** "2 changed, 1 added" for a version (UF-LMS-11, step 1). */
export function ChangeSummary({ changes }: { changes: VersionItem["changes"] }) {
  const t = useT("versions")
  const parts = [
    changes.added > 0 ? t("added", { count: changes.added }) : null,
    changes.changed > 0 ? t("changed", { count: changes.changed }) : null,
    changes.removed > 0 ? t("removed", { count: changes.removed }) : null,
    changes.outline_changed ? t("outlineChanged") : null,
  ].filter((part): part is string => part !== null)
  return <span>{parts.length > 0 ? parts.join(", ") : t("noChanges")}</span>
}
