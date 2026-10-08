"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { BootSplash } from "./boot-splash"
import { readConfig } from "./get-config"

const subscribe = () => () => undefined

/** True after hydration on the client and false while prerendering, so the static HTML never depends on `window.__ENV__`. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

/**
 * Renders `children` only when `window.__ENV__` is complete and valid. Otherwise it shows a plain error screen that
 * lists the missing keys, so a broken deployment is obvious instead of a half-working app.
 * The text is not translated on purpose: it appears before any provider (including i18n) can load.
 */
export function ConfigGate({ children }: { children: ReactNode }) {
  const isClient = useIsClient()
  // The static HTML and the first client render show the same spinner, so the page is never blank.
  if (!isClient) return <BootSplash />

  const result = readConfig()
  if (result.ok) return <>{children}</>

  return (
    <main
      role="alert"
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "system-ui, sans-serif",
        background: "#fafafa",
        color: "#18181b",
      }}
    >
      <section style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Configuration error</h1>
        <p style={{ margin: "0 0 12px", color: "#52525b" }}>
          The app cannot start because the runtime configuration is missing or invalid. Tell the administrator.
        </p>
        <ul aria-label="Missing configuration keys" style={{ margin: 0, paddingLeft: 20 }}>
          {result.missing.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
