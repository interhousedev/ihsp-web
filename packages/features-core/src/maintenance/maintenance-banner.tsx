"use client"

import { getPublicMaintenanceQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, buttonVariants, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

const POLL_MS = 30_000

/**
 * Shown on every page of an app while the platform is being moved to another server (read-only). Once the move is
 * done it links to the new server. A failed request shows nothing: the banner is a courtesy, not a gate. The default
 * margins suit a shell without content padding; a host that already pads its wrapper passes `className="m-0"`.
 */
export function MaintenanceBanner({ className }: { className?: string }) {
  const t = useT("maintenance")
  const query = useQuery({ ...getPublicMaintenanceQuery(), refetchInterval: POLL_MS })
  const state = query.data
  if (!state?.active) return null
  return (
    <Alert role="status" data-testid="maintenance-banner" className={cn("mx-4 mt-4 w-auto md:mx-6", className)}>
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription className="[&_a]:no-underline [&_a]:hover:text-primary-foreground">
        <p>{state.moved ? t("moved") : t("description")}</p>
        {state.target_url ? (
          <a href={state.target_url} rel="noreferrer" className={cn(buttonVariants({ variant: "default" }), "mt-2")}>
            {t("open")}
          </a>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
