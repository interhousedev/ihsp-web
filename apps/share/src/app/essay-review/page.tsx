import type { Metadata } from "next"
import { ReviewViewer } from "../../features/essay-review/review-viewer"

export const dynamic = "force-static"

/** `referrer: no-referrer` keeps the address out of any outgoing request; the page is not for search engines. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

/** `/ai/essay-review/#<token>`: the token is in the fragment, so no server or log ever sees it. */
export default function EssayReviewPage() {
  return <ReviewViewer />
}
