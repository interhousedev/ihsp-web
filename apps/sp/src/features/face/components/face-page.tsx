"use client"

import { deleteMyFace, getMyFaceQuery, keys, putMyFace } from "@ihsp/api"
import { BackLink, FacePhotoEditor, HidePhotoSwitch, QueryState, refreshSessionUser } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, PageContainer } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"

/** The photo the entrance device recognises. A face set by staff is shown read-only. */
export function FacePage() {
  const t = useT("face")
  const face = useQuery(getMyFaceQuery())
  const queryClient = useQueryClient()
  // A new face is also the profile photo: the session user is reloaded so every avatar shows it.
  const refresh = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: keys.me.face() }), refreshSessionUser(queryClient)])

  return (
    <PageContainer title={t("title")} back={<BackLink href="/profile/" label={t("back")} />}>
      <QueryState query={face} rows={3}>
        {(data) => (
          <Card>
            <CardHeader>
              <CardTitle>{t("photo")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {data.locked ? (
                <p role="status" className="text-sm">
                  {t("locked")}
                </p>
              ) : null}
              <FacePhotoEditor
                name={t("you")}
                photoUrl={data.photo_url}
                removable={data.has_face}
                readOnly={data.locked}
                onUpload={async (file) => {
                  await putMyFace(file)
                  await refresh()
                }}
                onRemove={async () => {
                  await deleteMyFace()
                  await refresh()
                }}
              />
              <HidePhotoSwitch />
              <p className="text-muted-foreground text-sm">{t("purpose")}</p>
              <p className="text-sm font-medium">{t("rule")}</p>
              <p className="text-muted-foreground text-sm">{t("privacy")}</p>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </PageContainer>
  )
}
