"use client"

import { useT } from "@ihsp/i18n"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useApplyUpdate } from "../hooks/use-apply-update"
import { useVersionCheck } from "../hooks/use-version-check"
import { mayForceReload, readForcedReload, writeForcedReload } from "../utils/update-guard"
import { ForcedUpdateScreen } from "./forced-update-screen"

const UPDATE_TOAST_ID = "ihsp-app-update"

/**
 * Acts on the answer of `GET /v1/app/version`. A build below `min_supported` is replaced at once (a cover screen, then a
 * reload with fresh pages); a build below `latest` gets a toast with a Reload button. After a forced reload that did not
 * help (the new build is not deployed yet) it falls back to the toast instead of looping.
 */
export function UpdateWatcher() {
  const t = useT("pwa")
  const { decision, info } = useVersionCheck()
  const update = useApplyUpdate()
  const [forcing, setForcing] = useState(false)

  useEffect(() => {
    if (decision === "force" && info && mayForceReload(readForcedReload(), info.min_supported, Date.now())) {
      writeForcedReload({ target: info.min_supported, at: Date.now() })
      setForcing(true)
      void update()
      return
    }
    if (decision === "none") {
      toast.dismiss(UPDATE_TOAST_ID)
      return
    }
    toast(t("update.available"), {
      id: UPDATE_TOAST_ID,
      description: t("update.description"),
      duration: Infinity,
      action: { label: t("update.reload"), onClick: () => void update() },
    })
  }, [decision, info, t, update])

  return forcing ? <ForcedUpdateScreen /> : null
}
