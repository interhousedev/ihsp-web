"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Pill } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useActivateVersion, useRevertSlot, type Slot } from "../api"

/** Stored versions with activation, and the revert to the built-in text. */
export function VersionsPanel({ slot, onLoad }: { slot: Slot; onLoad: (text: string) => void }) {
  const t = useT("promptStudio")
  const errorMessage = useErrorMessage()
  const activate = useActivateVersion(slot)
  const revert = useRevertSlot(slot)
  const [confirming, setConfirming] = useState(false)
  return (
    <section className="flex flex-col gap-3" aria-label={t("versions")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{t("versions")}</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={slot.active_version === 0}
          onClick={() => setConfirming(true)}
        >
          {t("revert")}
        </Button>
      </div>
      {slot.versions.length === 0 ? <p className="text-muted-foreground text-sm">{t("noVersions")}</p> : null}
      <ul className="flex flex-col gap-2">
        {slot.versions.map((v) => (
          <li
            key={v.version}
            className="border-hairline flex flex-wrap items-center gap-2 rounded-card border p-3 text-sm"
          >
            <span className="font-medium">{t("versionLabel", { version: v.version })}</span>
            {v.active ? <Pill tone="success">{t("active")}</Pill> : null}
            <span className="text-muted-foreground flex-1 truncate">{v.note}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => onLoad(v.text)}>
              {t("loadIntoEditor")}
            </Button>
            {v.active ? null : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={activate.isPending}
                onClick={() =>
                  activate.mutate(v.version, {
                    onSuccess: () => toast.success(t("activated", { version: v.version })),
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                {t("activate")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("revertTitle")}
        description={t("revertText")}
        confirmLabel={t("revert")}
        destructive
        loading={revert.isPending}
        onConfirm={() =>
          revert.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false)
              onLoad(slot.builtin)
              toast.success(t("reverted"))
            },
            onError: (e) => {
              setConfirming(false)
              toast.error(errorMessage(e))
            },
          })
        }
      />
    </section>
  )
}
