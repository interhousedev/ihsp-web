"use client"
import type { Role } from "@ihsp/api"
import { RequireAuth, RequireRole } from "@ihsp/auth"
import {
  AssistantEntry,
  LegalGate,
  MaintenanceBanner,
  PageLoading,
  ShellNavControls,
  browseHref,
  useLibraryAccess,
  usePlatformLinks,
} from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { AppShell, CommandPalette, OfflineBadge, type CommandPaletteResult, type NavGroup } from "@ihsp/ui"
import { Suspense, useCallback, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { LibraryBrand } from "./library-brand"
import { CatalogueSearch } from "./catalogue-search"
import { ProfileMenu } from "./profile-menu"
import { SignInButton } from "./sign-in-button"

/**
 * Who may open the page:
 * - `public`: everybody; a signed-out visitor sees the public part and a **Sign in** button (nothing starts a login);
 * - `auth`: signed-in users; a visitor is sent to the login and comes back;
 * - `{ roles }`: signed-in users with one of the roles (for example `["librarian", "admin"]`), others see "No access".
 */
export type LibraryAccessRule = "public" | "auth" | { roles: Role[] }

/** The search entry: the navigation, plus one result that runs the typed words as a catalogue search. */
function LibrarySearch({ nav }: { nav: NavGroup[] }) {
  const t = useT("shell")
  const search = useCallback(
    async (query: string): Promise<CommandPaletteResult[]> => [
      {
        id: `catalogue:${query}`,
        title: `${t("searchLabel")}: ${query}`,
        section: t("searchLabel"),
        url: browseHref({ q: query }),
        icon: "search",
      },
    ],
    [t],
  )
  return <CommandPalette nav={nav} search={search} />
}

function Frame({ children }: { children: ReactNode }) {
  const nav = useNav()
  const platforms = usePlatformLinks()
  const { status } = useLibraryAccess()
  return (
    <AppShell
      history={<ShellNavControls />}
      search={<LibrarySearch nav={nav.groups} />}
      moreSearch={<CatalogueSearch />}
      ai={<AssistantEntry />}
      profile={status === "anonymous" ? null : <ProfileMenu />}
      tools={
        <>
          <OfflineBadge />
          {status === "anonymous" ? <SignInButton /> : null}
        </>
      }
      nav={nav.groups}
      bottomNav={nav.bottom}
      platforms={platforms}
      brand={<LibraryBrand />}
      sidebarFooter={<ProfileMenu variant="row" />}
    >
      <MaintenanceBanner />
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
      <LegalGate />
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
