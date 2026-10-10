"use client"

import { getConfig } from "@ihsp/config"
import { getLmsCourseDraftQuery, postLmsCourseInviteCode, type InviteCodeResponse } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent, ConfirmDialog, CopyButton } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { hrefs } from "../../shared/utils/hrefs"

/** The invite code of an invite-only course and its link; rotating it makes the old code invalid (UF-LMS-02, 1a). */
export function InviteCodeCard({ courseId, canReadDraft }: { courseId: string; canReadDraft: boolean }) {
  const t = useT("staff")
  const errorMessage = useErrorMessage()
  const draft = useQuery({ ...getLmsCourseDraftQuery(courseId), enabled: canReadDraft, retry: false })
  const [rotated, setRotated] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const rotate = useMutation<InviteCodeResponse, unknown, void>({
    mutationFn: () => postLmsCourseInviteCode(courseId),
    onSuccess: (data) => {
      setRotated(data.invite_code)
      setConfirm(false)
    },
  })
  const code = rotated ?? draft.data?.invite_code ?? null
  const link = code ? `${getConfig().LMS_URL}${hrefs.join(code)}` : null

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("inviteTitle")}</h2>
        {code ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="bg-muted rounded px-3 py-2 font-mono text-lg tracking-widest" aria-label={t("inviteCode")}>
              {code}
            </code>
            <CopyButton value={code} label={t("copyCode")} />
            {link ? <CopyButton value={link} label={t("copyLink")} /> : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noCode")}</p>
        )}
        <div>
          <Button variant="outline" onClick={() => setConfirm(true)} className="min-h-11 md:min-h-8">
            {t("rotate")}
          </Button>
        </div>
        {rotate.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(rotate.error)}</AlertDescription>
          </Alert>
        ) : null}
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("rotateTitle")}
          confirmLabel={t("rotate")}
          destructive
          loading={rotate.isPending}
          onConfirm={() => rotate.mutate()}
        />
      </CardContent>
    </Card>
  )
}
