"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label, Textarea, cn } from "@ihsp/ui"
import { IconCircleCheck } from "@ihsp/ui"
import { useId } from "react"
import { RIGHTS_CLASSES, type BasisKind, type BookForm } from "./book-form"
import type { FormIssues } from "./book-form-checks"
import { FieldRow } from "./field-row"
import { checkPublicDomain } from "./public-domain"
import { UploadZone } from "./upload-zone"
import { VisibilityFields } from "./visibility-fields"

const LICENCES = ["CC0 1.0", "CC BY 4.0", "CC BY-SA 4.0", "CC BY-NC 4.0", "CC BY-NC-SA 4.0"] as const
const BASIS_KINDS: readonly BasisKind[] = ["death", "anonymous", "other"]

function PublicDomainFields({
  form,
  issues,
  today,
  onChange,
}: {
  form: BookForm
  issues: FormIssues
  today: Date
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor.rights")
  const error = useT("library.manage.editor.error")
  const id = useId()
  const year = form.basisKind === "death" ? form.deathYear : form.firstPublishedYear
  const check = checkPublicDomain(
    form.basisKind === "death"
      ? { author_death_year: Number(year) || null }
      : { first_published_year: Number(year) || null },
    today,
  )
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">{t("basis.label")}</legend>
        {BASIS_KINDS.map((kind) => (
          <Label key={kind} className="min-h-11 cursor-pointer gap-3 font-normal md:min-h-9">
            <input
              type="radio"
              name={`${id}-basis`}
              checked={form.basisKind === kind}
              onChange={() => onChange({ basisKind: kind })}
              className="size-4"
            />
            {t(`basis.${kind}`)}
          </Label>
        ))}
      </fieldset>
      {form.basisKind !== "other" ? (
        <FieldRow
          id={`${id}-year`}
          label={form.basisKind === "death" ? t("deathYear") : t("firstPublishedYear")}
          required
          error={issues.publicDomain ? error(issues.publicDomain.key, issues.publicDomain.values) : undefined}
        >
          <Input
            id={`${id}-year`}
            inputMode="numeric"
            value={year}
            aria-invalid={!!issues.publicDomain}
            className="min-h-11 md:min-h-8"
            onChange={(event) =>
              onChange(
                form.basisKind === "death"
                  ? { deathYear: event.target.value }
                  : { firstPublishedYear: event.target.value },
              )
            }
          />
        </FieldRow>
      ) : null}
      {check.status === "reached" ? (
        <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <IconCircleCheck className="me-1 inline size-4" aria-hidden />
          {t("since", { year: check.since })}
        </p>
      ) : null}
      <FieldRow id={`${id}-rule`} label={t("rule")} required hint={t("ruleHint")}>
        <Textarea
          id={`${id}-rule`}
          rows={2}
          value={form.rule}
          onChange={(event) => onChange({ rule: event.target.value })}
        />
      </FieldRow>
    </div>
  )
}

function OpenLicenceFields({
  form,
  issues,
  onChange,
}: {
  form: BookForm
  issues: FormIssues
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor.rights")
  const error = useT("library.manage.editor.error")
  const id = useId()
  return (
    <div className="flex flex-col gap-4">
      <FieldRow id={`${id}-licence`} label={t("licence")} required hint={t("licenceHint")}>
        <Input
          id={`${id}-licence`}
          list={`${id}-licences`}
          value={form.licence}
          className="min-h-11 md:min-h-8"
          onChange={(event) => onChange({ licence: event.target.value })}
        />
        <datalist id={`${id}-licences`}>
          {LICENCES.map((licence) => (
            <option key={licence} value={licence} />
          ))}
        </datalist>
      </FieldRow>
      <FieldRow
        id={`${id}-source`}
        label={t("sourceUrl")}
        required
        hint={t("sourceUrlHint")}
        error={issues.sourceUrl ? error(issues.sourceUrl.key) : undefined}
      >
        <Input
          id={`${id}-source`}
          type="url"
          inputMode="url"
          value={form.sourceUrl}
          aria-invalid={!!issues.sourceUrl}
          className="min-h-11 md:min-h-8"
          onChange={(event) => onChange({ sourceUrl: event.target.value })}
        />
      </FieldRow>
      <FieldRow id={`${id}-attribution`} label={t("attribution")} required hint={t("attributionHint")}>
        <Textarea
          id={`${id}-attribution`}
          rows={2}
          value={form.attribution}
          onChange={(event) => onChange({ attribution: event.target.value })}
        />
      </FieldRow>
    </div>
  )
}

function PermissionFields({
  form,
  issues,
  onChange,
}: {
  form: BookForm
  issues: FormIssues
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor.rights")
  const error = useT("library.manage.editor.error")
  const id = useId()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          {t("proof")}
          <span aria-hidden> *</span>
        </span>
        <UploadZone
          purpose="library_book"
          extensions={[".pdf", ".jpg", ".jpeg", ".png"]}
          label={t("proof")}
          hint={t("proofHint")}
          chooseLabel={t("proofChoose")}
          onUploaded={(file) => onChange({ proofFileId: file.id, proofFileName: file.name })}
        />
        {form.proofFileId ? (
          <p className="text-sm">
            <IconCircleCheck className="me-1 inline size-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
            {form.proofFileName ? t("proofAttached", { name: form.proofFileName }) : t("proofOnFile")}
          </p>
        ) : null}
      </div>
      <FieldRow id={`${id}-scope`} label={t("scope")} required hint={t("scopeHint")}>
        <Textarea
          id={`${id}-scope`}
          rows={2}
          value={form.permissionScope}
          onChange={(event) => onChange({ permissionScope: event.target.value })}
        />
      </FieldRow>
      <FieldRow
        id={`${id}-expiry`}
        label={t("expiry")}
        required
        hint={t("expiryHint")}
        error={issues.expiry ? error(issues.expiry.key) : undefined}
      >
        <Input
          id={`${id}-expiry`}
          type="date"
          value={form.permissionExpiresOn}
          aria-invalid={!!issues.expiry}
          className="min-h-11 w-full md:min-h-8 md:w-fit"
          onChange={(event) => onChange({ permissionExpiresOn: event.target.value })}
        />
      </FieldRow>
    </div>
  )
}

/**
 * The rights panel (§ 3.4): the class decides the fields. Public domain needs the author's death year (free from 1
 * January of year + 71) or the first publication of an anonymous work (year + 51) and the rule; the panel shows
 * "Public domain since YYYY" and refuses dates that are not free yet. An open licence needs the licence, the source
 * link and the attribution; a permission needs the proof file, its scope and expiry; an official textbook needs the
 * reference. Visibility and the download switch follow the class.
 */
export function RightsPanel({
  form,
  issues,
  disabled = false,
  today,
  onChange,
}: {
  form: BookForm
  issues: FormIssues
  disabled?: boolean
  /** The current date: passed in, so the "since" rule is exact in tests. */
  today: Date
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor.rights")
  const id = useId()
  const id2 = useId()
  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4 rounded-xl border p-4">
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-4">
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">{t("class.label")}</legend>
          {RIGHTS_CLASSES.map((value) => (
            <Label
              key={value}
              className={cn(
                "min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal",
                form.rights === value && "border-primary bg-primary/5",
              )}
            >
              <input
                type="radio"
                name={`${id2}-class`}
                value={value}
                checked={form.rights === value}
                onChange={() => onChange({ rights: value })}
                className="mt-0.5 size-4"
              />
              <span className="flex flex-col">
                <span className="font-medium">{t(`class.${value}.label`)}</span>
                <span className="text-muted-foreground text-xs">{t(`class.${value}.hint`)}</span>
              </span>
            </Label>
          ))}
        </fieldset>
        {form.rights === "public_domain" ? (
          <PublicDomainFields form={form} issues={issues} today={today} onChange={onChange} />
        ) : null}
        {form.rights === "open_license" ? <OpenLicenceFields form={form} issues={issues} onChange={onChange} /> : null}
        {form.rights === "permission" ? <PermissionFields form={form} issues={issues} onChange={onChange} /> : null}
        {form.rights === "official" ? (
          <FieldRow id={`${id}-reference`} label={t("reference")} required hint={t("referenceHint")}>
            <Textarea
              id={`${id}-reference`}
              rows={2}
              value={form.reference}
              onChange={(event) => onChange({ reference: event.target.value })}
            />
          </FieldRow>
        ) : null}
        <VisibilityFields form={form} onChange={onChange} />
      </fieldset>
    </section>
  )
}
