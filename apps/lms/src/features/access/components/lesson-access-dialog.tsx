"use client"

import type { AccessRule } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { QueryState } from "@ihsp/features-core"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useAccessRules, useSaveAccess } from "../hooks/use-access-rules"
import { AccessRuleForm } from "./access-rule-form"

const OPEN_RULE: AccessRule = { audience: "public", when_denied: "hidden", group_ids: [], users: [] }

/** The access of one lesson; a lesson without a rule follows the course, which the form shows as "public". */
export function LessonAccessDialog({
  courseId,
  stepId,
  title,
  canManage,
  open,
  onOpenChange,
}: {
  courseId: string
  stepId: string
  title: string
  canManage: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("access")
  const rules = useAccessRules(courseId)
  const save = useSaveAccess(courseId, stepId)
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lessonTitle", { title })}
      size="md"
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
          {t("close")}
        </Button>
      }
    >
      <QueryState query={rules} rows={3}>
        {(data) => {
          const rule = data.steps.find((item) => item.step_id === stepId)?.rule ?? OPEN_RULE
          return (
            <AccessRuleForm
              key={JSON.stringify(rule)}
              courseId={courseId}
              rule={rule}
              readOnly={!canManage}
              pending={save.isPending}
              error={save.error}
              idPrefix={`step-${stepId}`}
              onSave={(body) => save.mutate(body)}
            />
          )
        }}
      </QueryState>
    </ResponsiveDialog>
  )
}
