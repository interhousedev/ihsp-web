"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useLibraryAccess } from "../hooks/use-library-access"
import { browseHref } from "../utils/hrefs"
import { SignInLink } from "./sign-in-link"

/**
 * "This item is not available": the one text for anything the caller may not see (`404 library/not-found`), a removed
 * or hidden item, or a UniLibrary record while UniLibrary is off. It never says why. A signed-out visitor also gets a
 * Sign in button, because the item may be for lyceum users only.
 */
export function NotAvailable() {
  const t = useT("library.item")
  const home = useT("library.home")
  const { status } = useLibraryAccess()
  return (
    <div className="px-4 pt-4 md:px-6">
      <StateView
        state="empty"
        icon={<Icons.lock aria-hidden />}
        title={t("notAvailable")}
        description={t("notAvailableHint")}
        action={
          <>
            {status === "anonymous" ? <SignInLink label={t("signInToRead")} /> : null}
            <Link
              href={browseHref()}
              className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
            >
              <Icons.search aria-hidden />
              {home("emptyAction")}
            </Link>
          </>
        }
      />
    </div>
  )
}
