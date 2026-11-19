"use client"

import { getOnboardingQuery, type OnboardingStepKey } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { CertificatesStep } from "./certificates-step"
import { SelfieStep } from "./selfie-step"
import { StepIndicator, type IndicatorStep } from "./step-indicator"

/**
 * True while the first-login flow still has to show (loading or a step not done), so no other overlay may open. A
 * failed request lets the app through, as the gate does.
 */
export function useOnboardingGatePending(): boolean {
  const query = useQuery(getOnboardingQuery())
  if (query.isError) return false
  return query.isPending || (query.data?.steps ?? []).some((step) => !step.done)
}

/**
 * The first-login flow of a student: a full-screen layer over the app while `GET /v1/me/onboarding` lists steps that
 * are not done. There is no close button; the required photo step cannot be left. A failed request lets the app through.
 */
export function OnboardingGate() {
  const t = useT("onboarding")
  const query = useQuery(getOnboardingQuery())
  const pending = (query.data?.steps ?? []).filter((step) => !step.done)
  // The steps of this visit, so the indicator keeps a finished step instead of shrinking.
  const [visit, setVisit] = useState<OnboardingStepKey[]>([])
  const pendingKeys = pending.map((step) => step.key).join(",")
  useEffect(() => {
    if (pending.length === 0) return
    setVisit((previous) => {
      const merged = [...previous]
      for (const step of pending) if (!merged.includes(step.key)) merged.push(step.key)
      return merged.length === previous.length ? previous : merged
    })
    // `pending` is derived from `pendingKeys`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKeys])

  const layer = useRef<HTMLDivElement>(null)
  const open = pending.length > 0
  // The gate is modal: everything outside it (shell, bottom nav, the floating help button) is inert and the help
  // button is also hidden, so nothing takes focus or paints over the required steps.
  useEffect(() => {
    const node = layer.current
    if (!open || !node) return
    const touched: HTMLElement[] = []
    for (let child: HTMLElement = node; child.parentElement; child = child.parentElement) {
      for (const sibling of Array.from(child.parentElement.children)) {
        if (sibling === child || !(sibling instanceof HTMLElement) || sibling.inert) continue
        if (sibling.tagName === "SCRIPT" || sibling.tagName === "STYLE") continue
        sibling.inert = true
        touched.push(sibling)
      }
    }
    const widgets = Array.from(document.querySelectorAll<HTMLElement>("[data-help-widget]"))
    for (const widget of widgets) widget.style.visibility = "hidden"
    return () => {
      for (const element of touched) element.inert = false
      for (const widget of widgets) widget.style.visibility = ""
    }
  }, [open])

  const heading = useRef<HTMLHeadingElement>(null)
  const current = pending[0]?.key ?? null
  useEffect(() => {
    if (current) heading.current?.focus()
  }, [current])

  if (!current) return null

  const labels: Record<OnboardingStepKey, string> = {
    selfie: t("stepSelfie"),
    certificates: t("stepCertificates"),
  }
  const steps: IndicatorStep[] = (visit.length > 0 ? visit : [current]).map((key) => ({
    key,
    label: labels[key],
    state: key === current ? "current" : pending.some((step) => step.key === key) ? "upcoming" : "done",
  }))
  const title = current === "selfie" ? t("selfie.title") : t("certificates.title")

  return (
    <div
      ref={layer}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="bg-background fixed inset-0 z-40 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-5 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("label")}</p>
        <StepIndicator steps={steps} />
        <h1 id="onboarding-title" ref={heading} tabIndex={-1} className="text-2xl font-semibold outline-none">
          {title}
        </h1>
        {current === "selfie" ? <SelfieStep key="selfie" /> : <CertificatesStep key="certificates" />}
      </div>
    </div>
  )
}
