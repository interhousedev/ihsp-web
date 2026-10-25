"use client"

import type { SubjectMaterial, SubjectMaterialKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Icons } from "@ihsp/ui"

/** The materials of one tier; `onRemove` is missing for the read-only administration tier. */
export function MaterialList({
  materials,
  label,
  empty,
  onRemove,
  removing = false,
  note,
}: {
  materials: readonly (SubjectMaterial & { group_name?: string; subgroup?: number | null })[]
  label: string
  empty: string
  onRemove?: (material: SubjectMaterial) => void
  removing?: boolean
  note?: (material: SubjectMaterial) => string | null
}) {
  const t = useT("subjects.materials")
  const kinds: Record<SubjectMaterialKind, string> = {
    file: t("kind.file"),
    link: t("kind.link"),
    library_item: t("kind.library_item"),
  }
  if (materials.length === 0) return <p className="text-muted-foreground text-sm">{empty}</p>
  return (
    <ol aria-label={label} className="flex flex-col gap-2">
      {materials.map((material) => (
        <li key={material.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium break-words">{material.title}</span>
            <span className="flex min-w-0 items-center gap-2 text-xs">
              <Badge variant="secondary">{kinds[material.kind]}</Badge>
              {note?.(material) ? <span className="text-muted-foreground">{note(material)}</span> : null}
              {material.url ? (
                <span className="text-muted-foreground min-w-0 truncate" title={material.url}>
                  {material.url}
                </span>
              ) : null}
            </span>
          </div>
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 md:size-8"
              disabled={removing}
              aria-label={t("remove", { title: material.title })}
              onClick={() => onRemove(material)}
            >
              <Icons.trash aria-hidden />
            </Button>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
