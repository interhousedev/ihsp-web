"use client"

import type { ItemDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useLibraryAccess } from "../hooks/use-library-access"
import { myHref } from "../utils/hrefs"
import { DetailsFields } from "./details-fields"
import {
  emptyValues,
  kindOfItem,
  stepProblems,
  stepsFor,
  valuesFromItem,
  type MaterialValues,
  type StepId,
} from "./material-values"
import { releasePhoto } from "./photo-items"
import { UploadReviewNote } from "./upload-review-note"
import { SaveProgressView } from "./save-progress-view"
import { StepFiles } from "./step-files"
import { StepIndicator } from "./step-indicator"
import { StepKind } from "./step-kind"
import { AttestationBox, StepLicence } from "./step-licence"
import { StepReview } from "./step-review"
import { SubmittedPanel } from "./submitted-panel"
import { defaultLanguage, limitsFor } from "./upload-config"
import { UploadBlocked } from "./upload-blocked"
import { isBlockingUploadError } from "./upload-errors"
import { UploadProblem } from "./upload-problem"
import { useMaterialWorkflow } from "./use-material-workflow"

/**
 * The upload wizard (design § 9.2): 1 kind of file, 2 about the material, 3 content, 4 licence and attestation,
 * 5 review and **Submit**. **Save draft** works at any time from step 4 on, with or without the attestation
 * (`attested: false` keeps the draft private to its owner); **Next** and **Submit** need the box ticked. From then on
 * the user can leave and come back through `/upload/edit/?id=`.
 *
 * With an `item` (a draft, or an item with changes requested) the same wizard continues that draft: the attestation
 * was given already, so step 4 is left out, and the last button is **Resubmit** when the reviewer asked for changes.
 * `initialBody` is the Markdown text of such an item.
 */
export function UploadWizard({
  item,
  initialBody = "",
  onAnother,
}: {
  item?: ItemDetail
  initialBody?: string
  /** Called by "Add another material" on the final panel. */
  onAnother?: () => void
}) {
  const t = useT("library.upload")
  const router = useRouter()
  const { locale } = useFormatters()
  const access = useLibraryAccess()
  const existing = item !== undefined
  const limits = limitsFor(access.publishesDirectly)
  const canPublish = access.isTeacher
  const withOffice = access.isTeacher || access.isAdmin
  const resubmit = item?.status === "changes_requested"

  const [values, setValues] = useState<MaterialValues>(() =>
    item ? valuesFromItem(item, initialBody) : emptyValues(defaultLanguage(locale)),
  )
  const [index, setIndex] = useState(0)
  const [showProblems, setShowProblems] = useState(false)
  const [done, setDone] = useState<ItemDetail | null>(null)
  const workflow = useMaterialWorkflow({ itemId: item?.id ?? null, canPublish })

  // Decided once: saving the first file must not drop the "kind" step the user is standing on.
  const [needsKind] = useState(() => item !== undefined && kindOfItem(item) === null)
  const steps: StepId[] = useMemo(() => stepsFor(existing, needsKind), [existing, needsKind])
  const step = steps[index] ?? "review"
  const saveStep: StepId = existing ? "files" : "licence"
  const existingFile = item?.files.find((file) => file.format !== "md") ?? null
  const hasFile = existingFile !== null
  const last = index === steps.length - 1
  const blocked = isBlockingUploadError(workflow.error)

  const patch = (change: Partial<MaterialValues>) => setValues((current) => ({ ...current, ...change }))

  // Previews of photos are object URLs: release them when the wizard goes away.
  const photosRef = useRef(values.photos)
  useEffect(() => {
    photosRef.current = values.photos
  }, [values.photos])
  useEffect(() => () => photosRef.current.forEach(releasePhoto), [])

  // A new step starts at its heading, for keyboard and screen reader users.
  const heading = useRef<HTMLHeadingElement>(null)
  function goTo(update: (current: number) => number) {
    setIndex(update)
    requestAnimationFrame(() => heading.current?.focus())
  }

  // Typed work is lost when the page closes before the draft exists.
  const dirty = !done && (values.title.trim() !== "" || values.body.trim() !== "" || values.photos.length > 0)
  useEffect(() => {
    if (!dirty) return
    const listener = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", listener)
    return () => window.removeEventListener("beforeunload", listener)
  }, [dirty])

  async function next() {
    if (stepProblems(step, values, hasFile).length > 0) {
      setShowProblems(true)
      return
    }
    setShowProblems(false)
    if (step === saveStep && !(await workflow.save(values))) return
    goTo((current) => Math.min(current + 1, steps.length - 1))
  }

  function back() {
    workflow.clearError()
    setShowProblems(false)
    goTo((current) => Math.max(current - 1, 0))
  }

  async function submit() {
    // Each earlier step must be complete before the item is sent.
    for (const [position, id] of steps.entries()) {
      if (stepProblems(id, values, hasFile).length > 0) {
        goTo(() => position)
        setShowProblems(true)
        return
      }
    }
    if (!values.attested) {
      // Saving a draft needs no attestation, sending it does (`422 library/attestation-required`).
      goTo(() => steps.indexOf(existing ? "review" : "licence"))
      setShowProblems(true)
      return
    }
    const submitted = await workflow.submit(values)
    if (submitted) setDone(submitted)
  }

  async function saveDraft() {
    const saved = await workflow.save(values)
    if (saved) router.push(myHref("uploads"))
  }

  if (done) return <SubmittedPanel item={done} onAnother={existing ? undefined : onAnother} />

  const canSaveDraft = last || step === saveStep
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {item && (item.status_note || item.status_reason) ? (
        <UploadReviewNote reason={item.status_reason} message={item.status_note} />
      ) : null}
      <StepIndicator steps={steps} current={index} />

      {blocked ? (
        <UploadBlocked error={workflow.error} onRetry={workflow.clearError} />
      ) : (
        <>
          <section aria-labelledby="wizard-step-heading" className="flex flex-col gap-4">
            <h2 id="wizard-step-heading" ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
              {t(`steps.${step}`)}
            </h2>
            {step === "kind" ? <StepKind values={values} onChange={patch} showProblems={showProblems} /> : null}
            {step === "details" ? (
              <DetailsFields values={values} onChange={patch} showProblems={showProblems} readOnlyMeta={existing} />
            ) : null}
            {step === "files" ? (
              <StepFiles
                values={values}
                onChange={patch}
                showProblems={showProblems}
                limits={limits}
                withOffice={withOffice}
                existingFile={existingFile}
              />
            ) : null}
            {step === "licence" ? (
              <StepLicence values={values} onChange={patch} showProblems={showProblems} canPublish={canPublish} />
            ) : null}
            {step === "review" ? (
              <StepReview values={values} canPublish={canPublish} existingFile={existingFile} />
            ) : null}
            {/* A draft that was saved without the attestation still needs it before it is sent. */}
            {step === "review" && existing ? (
              <AttestationBox values={values} onChange={patch} showProblems={showProblems} />
            ) : null}
          </section>

          {workflow.error ? <UploadProblem error={workflow.error} limits={limits} /> : null}
          {workflow.pending ? <SaveProgressView progress={workflow.progress} /> : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              disabled={index === 0 || workflow.pending}
              onClick={back}
            >
              <Icons.chevronLeft aria-hidden />
              {t("back")}
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canSaveDraft ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={workflow.pending}
                  onClick={saveDraft}
                >
                  {t("saveDraft")}
                </Button>
              ) : null}
              {last ? (
                <Button type="button" className="min-h-11" disabled={workflow.pending} onClick={submit}>
                  <Icons.send aria-hidden />
                  {resubmit ? t("resubmit") : t("submit")}
                </Button>
              ) : (
                <Button type="button" className="min-h-11" disabled={workflow.pending} onClick={next}>
                  {t("next")}
                  <Icons.chevronRight aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
