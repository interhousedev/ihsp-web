"use client"

import type { Role } from "@ihsp/api"
import { RequireAuth, RequireRole } from "@ihsp/auth"
import { HistoryButtons, useLibraryAccess } from "@ihsp/features-core"
import { AppShell, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { LibraryBrand } from "./library-brand"
import { PageLoading } from "./page-loading"
import { ProfileMenu } from "./profile-menu"
import { SignInButton } from "./sign-in-button"

/**
 * Who may open the page:
 * - `public`: everybody; a signed-out visitor sees the public part and a **Sign in** button (nothing starts a login);
 * - `auth`: signed-in users; a visitor is sent to the login and comes back;
 * - `{ roles }`: signed-in users with one of the roles (for example `["librarian", "admin"]`), others see "No access".
 */
export type LibraryAccessRule = "public" | "auth" | { roles: Role[] }

function Header() {
  const { status, signedIn } = useLibraryAccess()
  return (
    <>
      <OfflineBadge />
      {signedIn ? <ProfileMenu /> : status === "anonymous" ? <SignInButton /> : null}
    </>
  )
}

function Frame({ children }: { children: ReactNode }) {
  const nav = useNav()
  return (
    <AppShell headerLeading={<HistoryButtons />} nav={nav.groups} bottomNav={nav.bottom} brand={<LibraryBrand />} header={<Header />}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </AppShell>
  )
}

/**
 * The frame of every page of this app: sidebar, phone bottom bar and the header with the profile menu.
 * Every page does `<LibraryShell access="public">` (or `"auth"`, or `{ roles }`) around its body; the `Suspense`
 * covers pages that read the address.
 */
export function LibraryShell({ access, children }: { access: LibraryAccessRule; children: ReactNode }) {
  if (access === "public") return <Frame>{children}</Frame>
  if (access === "auth") {
    return (
      <RequireAuth>
        <Frame>{children}</Frame>
      </RequireAuth>
    )
  }
  return (
    <RequireAuth>
      <Frame>
        <RequireRole role={access.roles}>{children}</RequireRole>
      </Frame>
    </RequireAuth>
  )
}
