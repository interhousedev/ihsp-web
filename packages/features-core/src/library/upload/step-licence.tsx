"use client"

import { useT } from "@ihsp/i18n"
import { Label, cn } from "@ihsp/ui"
import { useId } from "react"
import { stepProblems } from "./material-values"
import type { StepProps } from "./step-props"
import { OPEN_LICENCES } from "./upload-config"

const POLICY = ["made", "noScans", "noPersonal", "noHomework", "noExam", "noAds"] as const

/**
 * Step 4: the licence and the attestation. Everything is `all_rights_reserved` and visible to the lyceum, except when
 * a teacher chooses to make the material public: then a Creative Commons licence is needed (§ 3.5). The content
 * policy is shown here and the attestation checkbox must be ticked.
 */
export function StepLicence({ values, onChange, showProblems, canPublish }: StepProps & { canPublish: boolean }) {
  const t = useT("library.upload.licence")
  const material = useT("library.material.upload")
  const problems = showProblems ? stepProblems("licence", values) : []
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-labelledby="licence-heading">
        <h3 id="licence-heading" className="text-base font-semibold">
          {t("heading")}
        </h3>
        {canPublish ? (
          <>
            <Label className="min-h-11 cursor-pointer items-start gap-3 font-normal">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={values.makePublic}
                onChange={(event) =>
                  onChange({
                    makePublic: event.target.checked,
                    licence: event.target.checked ? "cc_by" : "all_rights_reserved",
                  })
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{t("makePublic")}</span>
                <span className="text-muted-foreground text-sm">{t("makePublicHint")}</span>
              </span>
            </Label>
            {values.makePublic ? (
              <fieldset className="flex flex-col gap-1" aria-describedby="licence-hint">
                <legend className="mb-1 text-sm font-medium">{t("openLicence")}</legend>
                <p id="licence-hint" className="text-muted-foreground mb-1 text-xs">
                  {t("openLicenceHint")}
                </p>
                {OPEN_LICENCES.map((licence) => (
                  <Label
                    key={licence}
                    className="min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 font-normal"
                  >
                    <input
                      type="radio"
                      name="material-licence"
                      value={licence}
                      className="mt-1 size-4"
                      checked={values.licence === licence}
                      onChange={() => onChange({ licence })}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{t(`name.${licence}`)}</span>
                      <span className="text-muted-foreground text-sm">{t(`text.${licence}`)}</span>
                    </span>
                  </Label>
                ))}
              </fieldset>
            ) : (
              <p className="text-muted-foreground text-sm">{t("lyceumOnly")}</p>
            )}
          </>
        ) : (
          <p className="text-sm">{t("lyceumOnly")}</p>
        )}
      </section>

      <section className="bg-muted/40 flex flex-col gap-2 rounded-xl border p-4" aria-labelledby="policy-heading">
        <h3 id="policy-heading" className="text-base font-semibold">
          {material("policyTitle")}
        </h3>
        <ul className="list-disc space-y-1 ps-5 text-sm">
          {POLICY.map((key) => (
            <li key={key}>{material(`policy.${key}`)}</li>
          ))}
        </ul>
      </section>

      <AttestationBox values={values} onChange={onChange} showProblems={showProblems} />
      {problems.includes("licenceRequired") ? (
        <p role="alert" className="text-destructive text-sm">
          {t("licenceRequired")}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The attestation checkbox ("I made this myself or I am allowed to share it"). Saving a draft does not need it; sending
 * the material for review does (`422 library/attestation-required` otherwise).
 */
export function AttestationBox({ values, onChange, showProblems }: StepProps) {
  const material = useT("library.material.upload")
  const attestId = useId()
  const missing = showProblems && !values.attested
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={attestId}
        className={cn(
          "min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal",
          missing && "border-destructive",
        )}
      >
        <input
          id={attestId}
          type="checkbox"
          className="mt-1 size-4 shrink-0"
          checked={values.attested}
          aria-invalid={missing}
          aria-describedby={missing ? `${attestId}-error` : undefined}
          onChange={(event) => onChange({ attested: event.target.checked })}
        />
        <span>{material("attest")}</span>
      </Label>
      {missing ? (
        <p id={`${attestId}-error`} role="alert" className="text-destructive text-sm">
          {material("attestRequired")}
        </p>
      ) : null}
    </div>
  )
}
