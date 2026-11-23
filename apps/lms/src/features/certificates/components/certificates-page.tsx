"use client"

import { getCertPartnersQuery, getCertSettingsQuery, getLmsCourseDraftQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { EditorFrame } from "../../editor/components/editor-frame"
import { DesignTab } from "./design-tab"
import { IssuedTab } from "./issued-tab"
import { PartnersTab } from "./partners-tab"
import { RulesTab } from "./rules-tab"

const TABS = ["design", "rules", "partners", "issued"] as const
type Tab = (typeof TABS)[number]
const tabParser = parseAsStringLiteral(TABS).withDefault("design")

/** `/edit/certificates/?course=`: the course certificate design, award rules, partners and the issued list. */
export function CertificatesPage({ courseId }: { courseId: string }) {
  const t = useT("courseCertificates")
  return (
    <EditorFrame courseId={courseId} current="settings" title={t("title")} requires={["edit"]}>
      {() => <CertificatesBody courseId={courseId} />}
    </EditorFrame>
  )
}

function CertificatesBody({ courseId }: { courseId: string }) {
  const t = useT("courseCertificates")
  const [tab, setTab] = useQueryState("tab", tabParser)
  const settings = useQuery(getCertSettingsQuery(courseId))
  const partners = useQuery(getCertPartnersQuery(courseId))
  const draft = useQuery(getLmsCourseDraftQuery(courseId))
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10 md:px-6">
      <QueryState query={settings} rows={3}>
        {(data) => (
          <Tabs value={tab} onValueChange={(value) => void setTab(value as Tab)}>
            <div className="-mx-1 overflow-x-auto px-1">
              <TabsList aria-label={t("tabsLabel")}>
                {TABS.map((key) => (
                  <TabsTrigger key={key} value={key} className="min-h-11 md:min-h-8">
                    {t(`tabs.${key}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="design" className="pt-4">
              <DesignTab
                courseId={courseId}
                courseTitle={draft.data?.title ?? ""}
                settings={data}
                partners={partners.data?.items ?? []}
              />
            </TabsContent>
            <TabsContent value="rules" className="pt-4">
              <RulesTab
                key={JSON.stringify(data)}
                courseId={courseId}
                settings={data}
                outline={draft.data?.outline ?? []}
              />
            </TabsContent>
            <TabsContent value="partners" className="pt-4">
              <PartnersTab courseId={courseId} settings={data} />
            </TabsContent>
            <TabsContent value="issued" className="pt-4">
              <IssuedTab courseId={courseId} />
            </TabsContent>
          </Tabs>
        )}
      </QueryState>
    </div>
  )
}
