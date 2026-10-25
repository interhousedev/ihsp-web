"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { subjectTypeKey } from "./curriculum-utils"

/** The EMIS subject type (general, in-depth, vocational, unified) as a small badge; nothing for an unknown type. */
export function SubjectTypeBadge({ typeId, className }: { typeId: number | null | undefined; className?: string }) {
  const t = useT("curriculum.types")
  const key = subjectTypeKey(typeId)
  if (key === null) return null
  return (
    <Badge variant="outline" className={className} data-type={key}>
      {t(key)}
    </Badge>
  )
}
