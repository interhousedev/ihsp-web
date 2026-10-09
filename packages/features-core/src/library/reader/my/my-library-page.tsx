"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { MyUploads } from "../../upload"
import { ContinueTab } from "./continue-tab"
import { ListsTab } from "./lists-tab"
import { NotesTab } from "./notes-tab"
import { ShelfTab } from "./shelf-tab"
import { MY_TABS, useMyTab } from "./use-my-tab"

/**
 * `/my/?tab=`: the student's own space (docs/reference/study-library.md § 3.9): Continue (the last six books), Shelf,
 * Notes (all highlights and notes, with export), Lists (reading lists of my groups) and Uploads. The tab is in the
 * address. There is no Offline tab: saving for offline is not part of this app yet.
 */
export function MyLibraryPage() {
  const t = useT("library.my")
  const [tab, setTab] = useMyTab()
  return (
    <PageContainer title={t("title")}>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = MY_TABS.find((name) => name === value)
          if (next) void setTab(next)
        }}
      >
        <TabsList variant="line" aria-label={t("title")} className="h-auto w-full justify-start overflow-x-auto">
          {MY_TABS.map((name) => (
            <TabsTrigger key={name} value={name} className="h-11 flex-none px-3 md:h-9">
              {t(`tabs.${name}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="continue" className="pt-2">
          <ContinueTab />
        </TabsContent>
        <TabsContent value="shelf" className="pt-2">
          <ShelfTab />
        </TabsContent>
        <TabsContent value="notes" className="pt-2">
          <h2 className="sr-only">{t("notesHeading")}</h2>
          <NotesTab />
        </TabsContent>
        <TabsContent value="lists" className="pt-2">
          <ListsTab />
        </TabsContent>
        <TabsContent value="uploads" className="pt-2">
          <MyUploads />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
