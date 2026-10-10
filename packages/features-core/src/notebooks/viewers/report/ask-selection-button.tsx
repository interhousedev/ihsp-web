"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconMessageQuestion } from "@ihsp/ui"
import { useWorkspace } from "../../workspace-context"

/**
 * "Ask about this": appears while text of the report is selected and sends the question to the chat with the
 * selection as its anchor. It floats at the bottom of the report so it never covers the selection.
 */
export function AskSelectionButton({ selection }: { selection: string }) {
  const t = useT("notebooks")
  const workspace = useWorkspace()
  if (selection === "") return null

  return (
    <div className="pointer-events-none sticky bottom-4 mt-4 flex justify-center print:hidden">
      <Button
        type="button"
        className="pointer-events-auto min-h-11 gap-1.5 shadow-md"
        // Keep the selection while the button is pressed.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          workspace.ask({ text: t("viewers.report.askPrompt"), anchor: { kind: "text", text: selection } })
          window.getSelection()?.removeAllRanges()
        }}
      >
        <IconMessageQuestion aria-hidden className="size-4" />
        {t("viewer.ask")}
      </Button>
    </div>
  )
}
