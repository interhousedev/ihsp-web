"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconBook2, IconCamera, IconFileTypePdf, IconMarkdown, type Icon } from "@tabler/icons-react"
import { useState } from "react"
import { SuggestDialog } from "./suggest-dialog"
import type { StepProps } from "./step-props"
import { UPLOAD_KINDS, type UploadKind } from "./upload-config"

const KIND_ICON: Record<UploadKind, Icon> = { markdown: IconMarkdown, pdf: IconFileTypePdf, photos: IconCamera }

/** Step 1: a Markdown note, a PDF, or photos of paper notes. The page also offers "Suggest a book". */
export function StepKind({ values, onChange, showProblems }: StepProps) {
  const t = useT("library.upload.kind")
  const [suggesting, setSuggesting] = useState(false)
  const missing = showProblems && values.kind === null
  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3" aria-describedby={missing ? "kind-error" : undefined}>
        <legend className="mb-1 text-base font-semibold">{t("heading")}</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {UPLOAD_KINDS.map((kind) => {
            const KindIcon = KIND_ICON[kind]
            const selected = values.kind === kind
            return (
              <label
                key={kind}
                className={cn(
                  "bg-card focus-within:ring-ring flex min-h-11 cursor-pointer gap-3 rounded-xl border p-4 focus-within:ring-2",
                  selected && "border-primary bg-primary/5 ring-primary ring-1",
                )}
              >
                <input
                  type="radio"
                  name="upload-kind"
                  value={kind}
                  checked={selected}
                  onChange={() => onChange({ kind })}
                  className="mt-1 size-4 shrink-0"
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-2 font-medium">
                    <KindIcon className="size-5" aria-hidden />
                    {t(kind)}
                  </span>
                  <span className="text-muted-foreground text-sm">{t(`${kind}Hint`)}</span>
                </span>
              </label>
            )
          })}
        </div>
        {missing ? (
          <p id="kind-error" role="alert" className="text-destructive text-sm">
            {t("required")}
          </p>
        ) : null}
      </fieldset>

      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            <IconBook2 className="size-5" aria-hidden />
            {t("suggestTitle")}
          </p>
          <p className="text-muted-foreground text-sm">{t("suggestText")}</p>
        </div>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setSuggesting(true)}>
          {t("suggestButton")}
        </Button>
      </div>
      <SuggestDialog open={suggesting} onOpenChange={setSuggesting} />
    </div>
  )
}
