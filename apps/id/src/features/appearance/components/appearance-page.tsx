"use client"

import { Card, CardContent, PageContainer } from "@ihsp/ui"
import { useTr } from "../../shared/hooks/use-tr"
import { ThemeChoiceGroup } from "./theme-choice-group"

/** `/appearance/`: light, dark or system theme for every IHSP platform (stored in `preferences.theme`). */
export function AppearancePage() {
  const t = useTr()
  return (
    <PageContainer title={t("appearance.title")} description={t("appearance.description")}>
      <Card className="max-w-xl">
        <CardContent>
          <ThemeChoiceGroup />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
