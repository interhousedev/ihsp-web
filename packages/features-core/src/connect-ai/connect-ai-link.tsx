"use client"

import type { ComponentProps, ReactNode } from "react"
import { openConnectAi, useConnectAiState } from "./connect-ai-store"

type ConnectAiLinkProps = Omit<ComponentProps<"a">, "href" | "children"> & {
  /** The wizard on the id app: followed where no `ConnectAiDialogHost` is mounted. */
  href: string
  /** Runs before the dialog opens (a sheet that should close first). */
  onOpen?: () => void
  children: ReactNode
}

/** Opens the wizard dialog in place when the app has one, otherwise a plain link to the id app. */
export function ConnectAiLink({ href, onOpen, onClick, children, ...rest }: ConnectAiLinkProps) {
  const { hosts } = useConnectAiState()
  if (hosts > 0) {
    return (
      <button
        type="button"
        className={rest.className}
        onClick={() => {
          onOpen?.()
          openConnectAi()
        }}
      >
        {children}
      </button>
    )
  }
  return (
    <a href={href} rel="noopener noreferrer" onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
