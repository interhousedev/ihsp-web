"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, Card, CardContent, CardHeader, CardTitle, cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useList } from "../../chooser/hooks"
import { useReadiness } from "../../readiness/api"
import { isUndecided } from "../nudges"

/** Window event the assistant dock listens for: `detail.text` is put into its input and the dock opens. */
export const ASSISTANT_PREFILL_EVENT = "admission:assistant-prefill"

export const startHereKey = (userId: string) => `ihsp:admission:start-here-dismissed:${userId}`

const LINK_STEPS = [
  { key: "quiz", href: "/career/?tab=explore", icon: Icons.sparkles },
  { key: "opportunities", href: "/opportunities/", icon: Icons.exams },
  { key: "courses", href: "/courses/", icon: Icons.courses },
  { key: "howItWorks", href: "/faq/", icon: Icons.help },
  { key: "journey", href: "/#journey", icon: Icons.route },
] as const

function readDismissed(userId: string): boolean {
  try {
    return window.localStorage.getItem(startHereKey(userId)) === "1"
  } catch {
    return false
  }
}

function storeDismissed(userId: string, dismissed: boolean) {
  try {
    if (dismissed) window.localStorage.setItem(startHereKey(userId), "1")
    else window.localStorage.removeItem(startHereKey(userId))
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
}

/**
 * Guided start for a student who has no list and no chosen field of study yet. Dismissible per user; a small button
 * on the home brings it back. Gone for good once a list item or a field exists.
 */
export function StartHereCard() {
  const t = useT("home.startHere")
  const { session } = useSession()
  const userId = session?.user.id
  const list = useList()
  const readiness = useReadiness()
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    if (userId) setDismissed(readDismissed(userId))
  }, [userId])

  if (!userId || dismissed === null || !list.data || !readiness.data) return null
  const hasField = readiness.data.components.some((component) => component.key === "major" && component.score > 0)
  if (!isUndecided({ listCount: list.data.length, hasField })) return null

  function set(value: boolean) {
    setDismissed(value)
    if (userId) storeDismissed(userId, value)
  }

  if (dismissed) {
    return (
      <div>
        <Button type="button" variant="link" className="min-h-11 px-0" onClick={() => set(false)}>
          {t("show")}
        </Button>
      </div>
    )
  }

  return (
    <Card data-testid="start-here" aria-labelledby="start-here-title" role="region">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle id="start-here-title" className="text-base">
          {t("title")}
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label={t("dismiss")}
          onClick={() => set(true)}
        >
          <Icons.close aria-hidden className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="grid grid-cols-2 gap-2">
          {LINK_STEPS.map(({ key, href, icon: Icon }) => (
            <li key={key}>
              <Link
                href={href}
                className="hover:border-primary/40 border-hairline-strong rounded-card focus-visible:ring-ring flex min-h-11 h-full items-start gap-2 border p-2.5 focus-visible:ring-2 focus-visible:outline-none md:gap-3 md:p-3"
              >
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{t(`steps.${key}.title`)}</span>
                  <span className="text-muted-foreground hidden text-xs md:block">{t(`steps.${key}.text`)}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-card h-full min-h-11 w-full items-start justify-start gap-2 p-2.5 text-start whitespace-normal md:gap-3 md:p-3",
              )}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent(ASSISTANT_PREFILL_EVENT, { detail: { text: t("assistantPrompt") } }),
                )
              }
            >
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                <Icons.chat aria-hidden className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold">{t("steps.assistant.title")}</span>
                <span className="text-muted-foreground hidden text-xs font-normal md:block">
                  {t("steps.assistant.text")}
                </span>
              </span>
            </button>
          </li>
        </ol>
      </CardContent>
    </Card>
  )
}
