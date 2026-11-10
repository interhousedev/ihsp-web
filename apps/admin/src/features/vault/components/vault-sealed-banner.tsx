"use client"

import { getAdminVaultStatusQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, buttonVariants } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Shown on every console page while the secrets vault is sealed (authenticator-app logins fail until it is
 * unsealed). A failed status request shows nothing; the vault page itself has its own status.
 */
export function VaultSealedBanner() {
  const t = useT("vault")
  const pathname = usePathname()
  const status = useQuery({ ...getAdminVaultStatusQuery(), refetchInterval: 60_000 })
  if (!status.data?.sealed || pathname.startsWith("/vault")) return null
  return (
    <Alert variant="destructive" role="alert" data-testid="vault-sealed-banner" className="mb-4">
      <AlertTitle>{t("banner.title")}</AlertTitle>
      <AlertDescription>
        <p>{t("banner.description")}</p>
        <Link href="/vault/" className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-2"}>
          {t("banner.action")}
        </Link>
      </AlertDescription>
    </Alert>
  )
}
