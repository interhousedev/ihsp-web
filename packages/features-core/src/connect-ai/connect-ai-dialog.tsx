"use client"

import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { useEffect } from "react"
import { NewConnectorFlow } from "../id-account/connectors/components/new-connector-page"
import { closeConnectAi, registerConnectAiHost, useConnectAiState } from "./connect-ai-store"

/**
 * The MCP setup wizard in a dialog (a bottom sheet on a phone), so "Connect my AI" never leaves the page. Mount it once
 * in an app's shell; `ConnectAiLink` then opens it instead of following the wizard address on the id app.
 */
export function ConnectAiDialogHost() {
  const t = useT("connectors.mcp")
  const { open } = useConnectAiState()
  useEffect(() => registerConnectAiHost(), [])

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeConnectAi()
      }}
      title={t("title")}
      size="lg"
      disablePointerDismissal
    >
      {open ? <NewConnectorFlow onDone={closeConnectAi} /> : null}
    </ResponsiveDialog>
  )
}
