import { Suspense } from "react"
import { ShareViewer } from "../features/share/share-viewer"

/** Any path outside `/ai/<slug>` (for example `/ai/view/x/y`) ends here; the viewer then shows "Link not found". */
export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <ShareViewer />
    </Suspense>
  )
}
