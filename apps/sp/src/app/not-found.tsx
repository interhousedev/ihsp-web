"use client"

import { useT } from "@ihsp/i18n"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  buttonVariants,
} from "@ihsp/ui"
import Link from "next/link"

/** Shown by nginx for unknown paths (`/404.html`) and by Next for `notFound()`. */
export default function NotFound() {
  const t = useT()
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.help aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("common.notFoundTitle")}</EmptyTitle>
          <EmptyDescription>{t("common.notFoundDescription")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/" className={buttonVariants({ className: "min-h-11" })}>
            {t("common.goHome")}
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  )
}
