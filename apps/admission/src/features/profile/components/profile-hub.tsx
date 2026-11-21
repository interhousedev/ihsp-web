"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { AppPageHeader, PageSection, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { WeightsEditor } from "../../weights/components/weights-editor"

const LINKS = [
  { id: "career", href: "/career/" },
  { id: "professions", href: "/profile/professions/" },
] as const

const DO_LINKS = [
  { id: "done", href: "/activities/" },
  { id: "planned", href: "/plan/" },
  { id: "ideas", href: "/opportunities/" },
  { id: "tests", href: "/tests/" },
  { id: "courses", href: "/courses/" },
] as const

function HubLink({ id, href }: { id: string; href: string }) {
  const t = useT("profileHub")
  return (
    <Link
      href={href}
      className="bg-card hover:bg-accent focus-visible:ring-ring flex min-h-14 items-center justify-between gap-3 rounded-card border p-4 outline-none focus-visible:ring-2"
    >
      <span className="min-w-0">
        <span className="block font-medium">{t(`link.${id}.title`)}</span>
        <span className="text-muted-foreground block text-sm">{t(`link.${id}.hint`)}</span>
      </span>
      <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
    </Link>
  )
}

/** The profile hub: career and professions, what matters (the fit radar), and the doing (activities, plan, tests). */
export function ProfileHub() {
  const t = useT("profileHub")
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader icon="user2" title={t("title")} />
        <PageSection title={t("career")}>
          <div className="grid gap-3 md:grid-cols-2">
            {LINKS.map((link) => (
              <HubLink key={link.id} {...link} />
            ))}
          </div>
        </PageSection>
        <section id="weights" aria-labelledby="hub-weights" className="flex scroll-mt-20 flex-col gap-3">
          <div>
            <h2 id="hub-weights" className="text-lg font-semibold tracking-tight">
              {t("weights")}
            </h2>
            <p className="text-muted-foreground text-sm">{t("weightsHint")}</p>
          </div>
          <div className="bg-card rounded-card border p-3 md:p-5">
            <WeightsEditor />
          </div>
        </section>
        <PageSection title={t("doing")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DO_LINKS.map((link) => (
              <HubLink key={link.id} {...link} />
            ))}
          </div>
        </PageSection>
      </div>
    </AdmissionShell>
  )
}
