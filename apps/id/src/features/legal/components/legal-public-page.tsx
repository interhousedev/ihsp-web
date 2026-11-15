"use client"

import type { LegalKind } from "@ihsp/api"
import { LegalDocumentPage } from "@ihsp/features-core"
import { LanguageSwitcher, ThemeToggle } from "@ihsp/ui"

/** A public page with one legal document; no sign-in needed, linked from the consent lists of every app. */
export function LegalPublicPage({ kind }: { kind: LegalKind }) {
  return (
    <div className="bg-muted/40 min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-end gap-2 px-4 py-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </header>
      <main className="bg-background rounded-card mx-auto mb-8 max-w-3xl border p-5 sm:p-8">
        <LegalDocumentPage kind={kind} />
      </main>
    </div>
  )
}
