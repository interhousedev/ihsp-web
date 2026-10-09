"use client"

import type { NotebookDetail } from "@ihsp/api"
import { Dialog, DialogContent } from "@ihsp/ui"
import { ChatConfigForm } from "./chat-config-form"

export type ChatConfigDialogProps = {
  notebook: NotebookDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Configure chat (docs/reference/notebooklm.md § 5.4.3): style cards (Default, Learning guide, Custom with a text of
 * up to 1 000 characters), response length and answer language; **Save** patches `chat_config` of the notebook.
 */
export function ChatConfigDialog({ notebook, open, onOpenChange }: ChatConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ChatConfigForm notebook={notebook} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
