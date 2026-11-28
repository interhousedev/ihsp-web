"use client"

import { useSession } from "@ihsp/auth"
import { HidePhotoSwitch, MyPhotoField, fullName } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"

/** The profile photo of the signed-in account, for every role: upload, replace, remove. */
export function PhotoCard() {
  const t = useT("photo")
  const { session } = useSession()
  if (!session) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">{t("description")}</p>
        <MyPhotoField name={fullName(session.user)} removeDescription={t("removeDescription")} />
        <HidePhotoSwitch />
      </CardContent>
    </Card>
  )
}
