"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { hrefs } from "../../shared/utils/hrefs"
import { ProfileMenu } from "../../shell/components/profile-menu"

/**
 * The dark top bar of the lesson player: the menu button (phones), the brand, the step strip in the middle and the
 * profile menu. The brand takes the width of the sidebar below it on desktop, as on Stepik.
 */
export function LearnerTopBar({ strip, onOpenContents }: { strip: ReactNode; onOpenContents: () => void }) {
  const t = useT("player")
  const app = useT("app")
  return (
    <header className="lms-chrome flex h-14 shrink-0 items-center gap-1 bg-(--stepik-chrome) px-1 md:h-12">
      <Button
        variant="ghost"
        className="size-11 shrink-0 lg:hidden"
        aria-label={t("openContents")}
        onClick={onOpenContents}
      >
        <Icons.panelLeft aria-hidden className="size-5" />
      </Button>
      <Link
        href={hrefs.catalog()}
        className="hidden h-11 w-60 shrink-0 items-center gap-2 rounded-md px-3 text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-(--stepik-green) lg:flex"
      >
        {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
        <img src="/icons/logo.svg" alt="" width={24} height={24} className="size-6 shrink-0 rounded-md" />
        <span className="truncate">{app("name")}</span>
      </Link>
      <div className="min-w-0 flex-1">{strip}</div>
      <div className="shrink-0">
        <ProfileMenu />
      </div>
    </header>
  )
}
