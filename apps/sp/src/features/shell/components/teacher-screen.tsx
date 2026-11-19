"use client"

import { logout } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { Button, Icons, StateView, buttonVariants } from "@ihsp/ui"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"

/** What a teacher sees in the student app: where to go instead, and a way to sign out. */
export function TeacherScreen() {
  const t = useT("teacherScreen")
  const config = getConfig()
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <StateView
        state="empty"
        className="border-0"
        icon={<Icons.help aria-hidden />}
        title={t("title")}
        description={t("text")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <a href={config.STAFF_URL} className={buttonVariants({ className: "min-h-11" })}>
              {t("staff")}
            </a>
            <a href={config.ID_URL} className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
              {t("id")}
            </a>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => {
                clearPersistedQueries()
                void logout()
              }}
            >
              {t("logout")}
            </Button>
          </div>
        }
      />
    </main>
  )
}
