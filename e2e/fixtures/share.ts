/**
 * The share viewer is one static page (`/ai/view/`). nginx serves it for every `/ai/<slug>` path; the Next.js dev
 * server does the same through a development-only rewrite (`apps/share/next.config.ts`), so the specs open the share
 * links exactly as the backend hands them out.
 */

/** `<slug>` of a share URL (`.../ai/<slug>`). */
export function shareSlug(url: string): string {
  return new URL(url).pathname.split("/").filter(Boolean).at(-1) ?? ""
}
