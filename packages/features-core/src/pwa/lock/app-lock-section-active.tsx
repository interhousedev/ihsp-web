"use client"

import { useAuthStore } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { useId, useState } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ihsp/ui"
import { usePinRecord } from "./use-pin-record"
import { withRelock } from "./pin"
import { writePinRecord } from "./pin-storage"
import { AppLockForm, type AppLockMode } from "./app-lock-form"
import { RelockSelect } from "./relock-select"

/** The pwa-mode half of `AppLockSection`: the state of the lock and the buttons that open the form. */
export function AppLockSectionActive() {
  const t = useT("pwa")
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const record = usePinRecord(userId)
  const titleId = useId()
  const [mode, setMode] = useState<AppLockMode | null>(null)
  if (!userId) return null

  return (
    <section aria-labelledby={titleId}>
      <Card>
        <CardHeader>
          <CardTitle id={titleId}>{t("lock.settings.title")}</CardTitle>
          <CardDescription>{t("lock.settings.description")}</CardDescription>
        </CardHeader>
        <CardContent>
      <p role="status" className="text-sm font-medium">
        {record ? t("lock.settings.on") : t("lock.settings.off")}
      </p>
      {record && !mode ? (
        <RelockSelect value={record.relock} onChange={(relock) => writePinRecord(userId, withRelock(record, relock))} />
      ) : null}
      {mode ? (
        <AppLockForm
          key={mode}
          mode={mode}
          userId={userId}
          record={record}
          onDone={() => setMode(null)}
          onCancel={() => setMode(null)}
        />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {record ? (
            <>
              <Button variant="outline" className="min-h-11" onClick={() => setMode("change")}>
                {t("lock.settings.change")}
              </Button>
              <Button variant="outline" className="min-h-11" onClick={() => setMode("remove")}>
                {t("lock.settings.remove")}
              </Button>
            </>
          ) : (
            <Button className="min-h-11" onClick={() => setMode("set")}>
              {t("lock.settings.set")}
            </Button>
          )}
        </div>
      )}
    </CardContent>
      </Card>
    </section>
  )
}
