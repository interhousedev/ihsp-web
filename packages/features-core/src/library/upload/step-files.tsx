"use client"

import type { ItemFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { FilePick, OFFICE_ACCEPT, PDF_ACCEPT } from "./file-pick"
import { stepProblems } from "./material-values"
import { MarkdownEditor } from "./markdown-editor"
import { PhotoPicker } from "./photo-picker"
import type { StepProps } from "./step-props"
import type { UploadLimits } from "./upload-config"

/**
 * Step 3: the content. A Markdown note is typed into the editor, a PDF (or DOCX/PPTX for teachers) is chosen, photos
 * are taken or picked. `existingFile` is the file an already saved item holds; it stays unless a new one is chosen.
 */
export function StepFiles({
  values,
  onChange,
  showProblems,
  limits,
  withOffice,
  existingFile,
}: StepProps & { limits: UploadLimits; withOffice: boolean; existingFile?: ItemFile | null }) {
  const t = useT("library.upload.files")
  const problems = showProblems ? stepProblems("files", values, Boolean(existingFile)) : []
  const message = (key: string) => (
    <p id="files-error" role="alert" className="text-destructive text-sm">
      {t(`problem.${key}`)}
    </p>
  )

  if (values.kind === "markdown") {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{t("markdownHeading")}</h3>
        <MarkdownEditor
          value={values.body}
          onChange={(body) => onChange({ body })}
          label={t("markdownLabel")}
          invalid={problems.includes("bodyRequired")}
          describedBy={problems.length > 0 ? "files-error" : undefined}
        />
        {problems.includes("bodyRequired") ? message("bodyRequired") : null}
      </div>
    )
  }
  if (values.kind === "pdf") {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{withOffice ? t("officeHeading") : t("pdfHeading")}</h3>
        <FilePick
          file={values.pdf}
          onChange={(pdf) => onChange({ pdf })}
          accept={withOffice ? OFFICE_ACCEPT : PDF_ACCEPT}
          limits={limits}
          withOffice={withOffice}
          invalid={problems.includes("pdfRequired")}
          describedBy={problems.length > 0 ? "files-error" : undefined}
          existing={existingFile ? { bytes: existingFile.byte_size, pages: existingFile.pages } : null}
        />
        {problems.includes("pdfRequired") ? message("pdfRequired") : null}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold">{t("photosHeading")}</h3>
      {existingFile && values.photos.length === 0 ? (
        <p className="bg-muted/40 rounded-xl border p-3 text-sm" data-testid="existing-file">
          {t("existingPhotos", { pages: existingFile.pages ?? 0 })}
        </p>
      ) : null}
      <PhotoPicker
        photos={values.photos}
        onChange={(photos) => onChange({ photos })}
        invalid={problems.includes("photosRequired")}
        describedBy={problems.length > 0 ? "files-error" : undefined}
      />
      {problems.includes("photosRequired") ? message("photosRequired") : null}
    </div>
  )
}
