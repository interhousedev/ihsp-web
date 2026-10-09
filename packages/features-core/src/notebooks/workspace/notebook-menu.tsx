"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconDotsVertical } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useDeleteNotebook, useDeleteNotebookChat } from "../api"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { ChatConfigDialog } from "./panes"

type Dialog = "config" | "clearChat" | "delete" | null

/** The ⋮ menu of the header: configure the chat, delete the chat history, delete the notebook. */
export function NotebookMenu({ notebook }: { notebook: NotebookDetail }) {
  const t = useT("notebooks")
  const common = useT("common")
  const router = useRouter()
  const errorMessage = useNotebookErrorMessage()
  const [dialog, setDialog] = useState<Dialog>(null)
  const clearChat = useDeleteNotebookChat(notebook.id)
  const remove = useDeleteNotebook()

  function close() {
    setDialog(null)
    clearChat.reset()
    remove.reset()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 md:size-9"
              aria-label={t("workspace.menu")}
            />
          }
        >
          <IconDotsVertical aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={() => setDialog("config")}>
            {t("menu.configureChat")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 md:min-h-8"
            disabled={notebook.can_write === false}
            onClick={() => setDialog("clearChat")}
          >
            {t("chat.clear")}
          </DropdownMenuItem>
          {notebook.course_id == null ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="min-h-11 md:min-h-8"
                onClick={() => setDialog("delete")}
              >
                {t("workspace.deleteNotebook")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChatConfigDialog notebook={notebook} open={dialog === "config"} onOpenChange={(open) => !open && close()} />

      <ConfirmDialog
        open={dialog === "clearChat"}
        onOpenChange={(open) => !open && close()}
        title={t("chat.clear")}
        description={t("chat.clearConfirm")}
        confirmLabel={common("delete")}
        destructive
        loading={clearChat.isPending}
        onConfirm={() => clearChat.mutate(undefined, { onSuccess: close })}
      >
        {clearChat.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(clearChat.error)}
          </p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && close()}
        title={t("delete.title")}
        description={t("delete.description")}
        confirmLabel={t("card.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(notebook.id, {
            onSuccess: () => {
              close()
              router.push("/notebooks/")
            },
          })
        }
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
