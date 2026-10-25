import type { CSSProperties } from "react"

const KEYFRAMES = "@keyframes ihsp-boot-spin{to{transform:rotate(360deg)}}"

const frame: CSSProperties = {
  display: "flex",
  minHeight: "100dvh",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
}

const hidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
}

/**
 * The one loading screen of an app: a centered spinner, with no text that changes between steps. It is rendered by
 * the static HTML (before any script runs), by `ConfigGate` and `I18nProvider` while they wait, and by `RequireAuth`
 * and the login callback, so a login shows a single calm spinner instead of a blank page and then several screens.
 * It uses plain inline styles because it must work before the stylesheet, the theme and the messages are available.
 * `label` is the (translated) text for screen readers; before the messages exist it is "Loading".
 */
export function BootSplash({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" data-boot-splash="" style={frame}>
      <style>{KEYFRAMES}</style>
      <svg
        aria-hidden="true"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ color: "var(--muted-foreground, #71717a)", animation: "ihsp-boot-spin 0.8s linear infinite" }}
      >
        <path d="M12 3a9 9 0 1 0 9 9" />
      </svg>
      <span style={hidden}>{label}</span>
    </div>
  )
}
