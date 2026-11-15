"use client"

import { getMeLegalPendingQuery, isApiError, keys, postMeLegalAccept, type PendingLegalItem } from "@ihsp/api"
import { logout, useSession } from "@ihsp/auth"
import { getConfig } from "@ihsp/config"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LegalDocumentView } from "./legal-document-view"
import { legalHref } from "./use-legal-documents"

function PendingItem({ item }: { item: PendingLegalItem }) {
  const t = useT("legal")
  return (
    <section className="grid gap-1.5">
      <h3 className="text-sm font-medium">{item.title}</h3>
      {item.announcement ? <LegalDocumentView markdown={item.announcement} className="text-sm" /> : null}
      <a
        className="text-xs text-primary underline-offset-4 hover:underline"
        href={legalHref(getConfig().ID_URL, item.kind)}
        target="_blank"
        rel="noreferrer"
      >
        {t("gate.readFull")}
      </a>
    </section>
  )
}

/**
 * Blocks the signed-in user until every newly published document is accepted. It cannot be dismissed; the only
 * other way out is to sign out. Mounted once in each authenticated shell.
 */
export function LegalGate() {
  const { status } = useSession()
  const t = useT("legal")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const pending = useQuery({ ...getMeLegalPendingQuery(), enabled: status === "authenticated" })
  const items = pending.data?.items ?? []

  const accept = useMutation({
    mutationFn: () => postMeLegalAccept({ items: items.map(({ kind, version }) => ({ kind, version })) }),
    onSuccess: (remaining) => queryClient.setQueryData(keys.legal.pending(), remaining),
    onError: (error) => {
      // A newer version was published meanwhile: show the fresh list instead of accepting a stale one.
      if (isApiError(error) && error.type === "legal/stale-version") {
        void queryClient.invalidateQueries({ queryKey: keys.legal.pending() })
      }
    },
  })

  if (status !== "authenticated" || items.length === 0) return null
  return (
    <Dialog open onOpenChange={() => undefined} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("gate.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {items.map((item) => (
            <PendingItem key={`${item.kind}-${item.version}`} item={item} />
          ))}
        </div>
        {accept.isError ? <Alert variant="destructive">{errorMessage(accept.error)}</Alert> : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => void logout()}>
            {t("gate.signOut")}
          </Button>
          <Button type="button" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {t("gate.accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
