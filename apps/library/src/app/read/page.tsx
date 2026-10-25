"use client"

import { ReaderPage } from "@ihsp/features-core"
import { LibraryShell } from "../../features/shell/components/library-shell"

/**
 * The reader (`?item&file&page&loc`). Public books are read by visitors too (without notes or saved progress);
 * lyceum items answer "This item is not available" with a Sign in button.
 */
export default function Page() {
  return (
    <LibraryShell access="public">
      <ReaderPage />
    </LibraryShell>
  )
}
