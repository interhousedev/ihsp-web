"use client"

import { usePathname } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react"
import type { ScreenPayload } from "./api"

export const SUMMARY_LIMIT = 6000

type Published = { title?: string; summary: string }
type Registry = { publish: (value: Published | null) => void; read: () => Published | null }

const ScreenRegistry = createContext<Registry | null>(null)

/** Holds what the current page says it shows; the assistant reads it when a message is sent. */
export function ScreenContextProvider({ children }: { children: ReactNode }) {
  const current = useRef<Published | null>(null)
  const publish = useCallback((value: Published | null) => {
    current.current = value
  }, [])
  const read = useCallback(() => current.current, [])
  const registry = useMemo(() => ({ publish, read }), [publish, read])
  return <ScreenRegistry.Provider value={registry}>{children}</ScreenRegistry.Provider>
}

/**
 * A page calls this to tell the assistant what is on screen (a short text built from the data it shows). Without it
 * the assistant falls back to the page title and the text of `<main>`.
 */
export function useScreenContext({ title, summary }: { title?: string; summary: string }): void {
  const registry = useContext(ScreenRegistry)
  useEffect(() => {
    if (!registry) return
    registry.publish({ title, summary })
    return () => registry.publish(null)
  }, [registry, title, summary])
}

function mainText(): string {
  const main = document.querySelector("main")
  return (main?.innerText ?? main?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, SUMMARY_LIMIT)
}

/** The payload for the backend: route path, title and summary of what the user sees now. */
export function useReadScreen(): () => ScreenPayload {
  const registry = useContext(ScreenRegistry)
  const path = usePathname()
  return useCallback(() => {
    const published = registry?.read() ?? null
    return {
      path,
      title: published?.title ?? document.title,
      summary: (published?.summary ?? mainText()).slice(0, SUMMARY_LIMIT),
    }
  }, [registry, path])
}

/** Renders nothing; publishes a summary from a place where a hook cannot be called (outside the shell). */
export function ScreenSummary({ title, summary }: { title?: string; summary: string }) {
  useScreenContext({ title, summary })
  return null
}
