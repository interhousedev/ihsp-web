"use client"

import { useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { FreeCoursePicker } from "./free-course-picker"
import { LmsCoursePicker } from "./lms-course-picker"

export type AddCourseTab = "lms" | "free" | "manual"

/** One entry point for every way of adding a course: LMS catalog, free university course, or taken elsewhere. */
export function AddCourseDialog({
  open,
  onOpenChange,
  tab,
  onTabChange,
  onManual,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tab: AddCourseTab
  onTabChange: (tab: AddCourseTab) => void
  onManual: () => void
}) {
  const t = useT("courses")
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("addDialog.title")}>
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as AddCourseTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="lms" className="min-w-0 flex-1 px-2 text-xs sm:text-sm">
            {t("addDialog.lms")}
          </TabsTrigger>
          <TabsTrigger value="free" className="min-w-0 flex-1 px-2 text-xs sm:text-sm">
            {t("addDialog.free")}
          </TabsTrigger>
          <TabsTrigger value="manual" className="min-w-0 flex-1 px-2 text-xs sm:text-sm">
            {t("addDialog.manual")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lms">{tab === "lms" ? <LmsCoursePicker /> : null}</TabsContent>
        <TabsContent value="free">{tab === "free" ? <FreeCoursePicker /> : null}</TabsContent>
        <TabsContent value="manual">
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground text-sm">{t("addDialog.manualHint")}</p>
            <Button onClick={onManual}>{t("manual.title")}</Button>
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveDialog>
  )
}
