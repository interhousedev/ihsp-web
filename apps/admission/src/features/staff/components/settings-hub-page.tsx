"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { useSession } from "@ihsp/auth"
import { Card, CardContent } from "@ihsp/ui"
import Link from "next/link"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { MapsUrlCard } from "./maps-url-card"
import { SchoolGradesCard } from "./school-grades-card"

const ITEMS = [
  { key: "testCatalog", href: "/staff/test-catalog/" },
  { key: "readinessWeights", href: "/staff/readiness-weights/" },
  { key: "careerSettings", href: "/staff/career-settings/" },
] as const

/** Entry point of the admission settings that counselors and administrators edit. */
export function SettingsHubBody() {
  const t = useT("settingsHub")
  const isAdmin = !!useSession().session?.user.roles?.includes("admin")
  return (
    <div className={pageClass()}>
      <AppPageHeader icon="settings" title={t("title")} />
      <ul className="grid gap-3 md:grid-cols-2">
        {ITEMS.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="block">
              <Card className="hover:bg-muted/40 transition-colors">
                <CardContent className="flex flex-col gap-1">
                  <h3 className="font-semibold">{t(`${item.key}.title`)}</h3>
                  <p className="text-muted-foreground text-sm">{t(`${item.key}.text`)}</p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {isAdmin && <SchoolGradesCard />}
      {isAdmin && <MapsUrlCard />}
    </div>
  )
}

export function SettingsHubPage() {
  return (
    <AdmissionShell roles={["admin", "counselor"]}>
      <SettingsHubBody />
    </AdmissionShell>
  )
}
