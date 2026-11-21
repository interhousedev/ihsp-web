"use client"

import type { Role } from "@ihsp/api"
import { RequireAuth, RequireRole, useSession } from "@ihsp/auth"
import {
  MaintenanceBanner,
  NotificationBell,
  PageLoading,
  ShellNavControls,
  usePlatformLinks,
} from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { AppShell, buttonVariants, CommandPalette, Icons, OfflineBadge, StateView } from "@ihsp/ui"
import { ShellSearch } from "./shell-search"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, type ReactNode } from "react"
import { hasNoAdmissionAccess, isStaffOnly, landingFor, useNav } from "../../../config/nav"
import { useIsAlumnus } from "../../../config/applicant"
import { useNotApplicantError } from "../use-not-applicant-error"
import { SectionTabs } from "../../../components/section-tabs"
import { AdmissionBrand } from "./admission-brand"
import { AssistantHeaderButton, AssistantLauncher, ScreenContextProvider } from "../../assistant"
import { StudentTour } from "../../steps"
import { AdmissionConsentGate } from "../../consent/components/consent-gate"
import { ProfileMenu } from "./profile-menu"
import { SecondaryMenu } from "./secondary-menu"
import { SectionBottomBar } from "./section-bottom-bar"

/** Applicant pages: staff without the student role get a "no access" screen with a way to their own page. */
function StudentArea({ home, children }: { home?: boolean; children: ReactNode }) {
  const t = useT()
  const router = useRouter()
  const { session } = useSession()
  const roles = session?.user.roles
  const alumnus = useIsAlumnus()
  const staffOnly = isStaffOnly(roles, alumnus)
  const notApplicant = useNotApplicantError()
  useEffect(() => {
    if (home && staffOnly) router.replace(landingFor(roles, alumnus))
  }, [home, staffOnly, roles, alumnus, router])
  if (notApplicant && !staffOnly) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center p-4">
        <StateView
          state="empty"
          className="border-0"
          icon={<Icons.lock aria-hidden />}
          title={t("nav.notApplicantTitle")}
          description={t("nav.notApplicant")}
        />
      </div>
    )
  }
  if (hasNoAdmissionAccess(roles, alumnus)) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center p-4">
        <StateView
          state="empty"
          className="border-0"
          icon={<Icons.lock aria-hidden />}
          title={t("auth.forbiddenTitle")}
          description={t("nav.noAdmission")}
        />
      </div>
    )
  }
  if (!staffOnly) return <>{children}</>
  if (home) return <PageLoading />
  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-4">
      <StateView
        state="empty"
        className="border-0"
        icon={<Icons.lock aria-hidden />}
        title={t("auth.forbiddenTitle")}
        description={t("nav.studentOnly")}
        action={
          <Link href={landingFor(roles, alumnus)} className={buttonVariants()}>
            {t("nav.toStaff")}
          </Link>
        }
      />
    </div>
  )
}

function Frame({ tour, children }: { tour: boolean; children: ReactNode }) {
  const nav = useNav()
  const { session } = useSession()
  const roles = session?.user.roles
  const alumnus = useIsAlumnus()
  const showTour = tour && !hasNoAdmissionAccess(roles, alumnus)
  const platforms = usePlatformLinks()
  // Applicants get the five-section bar and a header menu; staff and users without access keep the stock bar with "More".
  const sectionNav = !isStaffOnly(roles, alumnus) && !hasNoAdmissionAccess(roles, alumnus)
  const [, secondary, ...staff] = nav.groups
  return (
    <AppShell
      history={<ShellNavControls />}
      search={sectionNav ? <ShellSearch nav={nav.groups} /> : <CommandPalette nav={nav.groups} />}
      nav={nav.groups}
      bottomNav={sectionNav ? undefined : nav.bottom}
      bottomBar={sectionNav ? <SectionBottomBar items={nav.bottom} /> : undefined}
      platforms={platforms}
      brand={<AdmissionBrand />}
      ai={<AssistantHeaderButton />}
      bell={<NotificationBell />}
      settingsHref="/settings/"
      profile={<ProfileMenu />}
      sidebarFooter={<ProfileMenu variant="row" />}
      tools={
        <>
          <OfflineBadge />
          {sectionNav ? (
            <SecondaryMenu links={secondary?.items ?? []} staff={staff.flatMap((group) => group.items)} />
          ) : null}
        </>
      }
    >
      <ScreenContextProvider>
        <MaintenanceBanner />
        {sectionNav ? <SectionTabs /> : null}
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
        <div
          data-testid="phone-bottom-reserve"
          className="h-[calc(var(--safe-bottom,0px)+9.5rem)] md:hidden"
          aria-hidden
        />
        <AdmissionConsentGate />
        <AssistantLauncher />
        {showTour ? <StudentTour /> : null}
      </ScreenContextProvider>
    </AppShell>
  )
}

/**
 * The frame of every page: sign-in is required; `roles` limits the page to those roles (the staff area), `anyone`
 * opens it to every signed-in user (settings); otherwise it is an applicant page and staff-only users are turned away.
 * The `Suspense` covers pages that read the address.
 */
export function AdmissionShell({
  roles,
  anyone,
  home,
  children,
}: {
  roles?: Role[]
  anyone?: boolean
  /** The landing page: staff-only users are sent to their own start page instead of seeing "no access". */
  home?: boolean
  children: ReactNode
}) {
  const body = roles ? (
    <RequireRole role={roles}>{children}</RequireRole>
  ) : anyone ? (
    children
  ) : (
    <StudentArea home={home}>{children}</StudentArea>
  )
  return (
    <RequireAuth>
      <Frame tour={!roles}>{body}</Frame>
    </RequireAuth>
  )
}
