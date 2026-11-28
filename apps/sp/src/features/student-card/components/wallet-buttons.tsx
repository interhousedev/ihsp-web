"use client"

import { getMeStudentCardApplePass, postMeStudentCardGoogleWallet, type StudentCardWalletAvailability } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useMutation } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { currentWalletPlatform, type WalletPlatform } from "../utils/wallet-platform"

/** Saves the `.pkpass` (fetched with the session) through a temporary link; Safari then offers to add it. */
function savePass(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "student-card.pkpass"
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 shrink-0" aria-hidden>
      <path d="M16.37 12.62c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5ZM14.2 6.16c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22Z" />
    </svg>
  )
}

function GoogleWalletMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
      <rect x="3" y="5" width="18" height="5" rx="1.5" fill="#4285F4" />
      <rect x="3" y="8" width="18" height="5" rx="1.5" fill="#34A853" />
      <rect x="3" y="11" width="18" height="5" rx="1.5" fill="#FBBC04" />
      <path d="M3 14h18v3.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" fill="#EA4335" />
    </svg>
  )
}

/** The black badge both wallets' guidelines ask for: the mark and the official wording, nothing else. */
function Badge({ label, mark, busy, onClick }: { label: string; mark: ReactNode; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="flex h-12 min-w-44 items-center justify-center gap-2 rounded-card border border-[#a6a6a6] bg-black px-4 text-sm font-medium text-white transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
    >
      {mark}
      <span>{label}</span>
    </button>
  )
}

/**
 * "Add to Apple Wallet" on Apple devices, "Add to Google Wallet" on Android, both elsewhere; a wallet the server has
 * not set up is hidden. `platform` overrides the detection (tests).
 */
export function WalletButtons({
  wallet,
  platform,
}: {
  wallet: StudentCardWalletAvailability
  platform?: WalletPlatform
}) {
  const t = useT("studentCard")
  const [device] = useState<WalletPlatform>(() => platform ?? currentWalletPlatform())
  const apple = useMutation({ mutationFn: () => getMeStudentCardApplePass(), onSuccess: savePass })
  const google = useMutation({
    mutationFn: () => postMeStudentCardGoogleWallet(),
    onSuccess: ({ url }) => {
      if (!window.open(url, "_blank", "noopener")) window.location.assign(url)
    },
  })
  const showApple = wallet.apple && device !== "android"
  const showGoogle = wallet.google && device !== "apple"
  if (!showApple && !showGoogle) return null
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        {showApple ? (
          <Badge
            label={t("addToAppleWallet")}
            mark={<AppleMark />}
            busy={apple.isPending}
            onClick={() => apple.mutate()}
          />
        ) : null}
        {showGoogle ? (
          <Badge
            label={t("addToGoogleWallet")}
            mark={<GoogleWalletMark />}
            busy={google.isPending}
            onClick={() => google.mutate()}
          />
        ) : null}
      </div>
      {apple.isError || google.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {t("walletFailed")}
        </p>
      ) : null}
    </div>
  )
}
