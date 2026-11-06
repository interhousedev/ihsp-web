"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "./icons"
import { StateView } from "./state-view"
import { buttonVariants } from "./ui/button"

const FRAME = "flex min-h-dvh items-center justify-center p-4"

/**
 * The whole-page 404 of every app: shown by nginx for unknown paths (`/404.html`) and by Next for `notFound()`.
 * A plain link on purpose: `@ihsp/ui` knows no router, and leaving a dead address may as well reload.
 */
export function NotFoundPage({ homeHref = "/" }: { homeHref?: string }) {
  const t = useT()
  return (
    <main className={FRAME}>
      <StateView
        state="empty"
        className="border-0"
        icon={<Icons.help aria-hidden />}
        title={t("common.notFoundTitle")}
        description={t("common.notFoundDescription")}
        action={
          <a href={homeHref} className={buttonVariants({ className: "min-h-11" })}>
            {t("common.goHome")}
          </a>
        }
      />
    </main>
  )
}

/** The whole-page crash screen behind every app's `error.tsx`. It never shows the error itself. */
export function ErrorPage({ onRetry }: { onRetry: () => void }) {
  const t = useT()
  return (
    <main className={FRAME}>
      <StateView state="error" className="border-0" description={t("state.crashDescription")} onRetry={onRetry} />
    </main>
  )
}
