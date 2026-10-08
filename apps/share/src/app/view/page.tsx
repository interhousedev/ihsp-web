import { Suspense } from "react"
import { ShareViewer } from "../../features/share/share-viewer"

export const dynamic = "force-static"

/** One page for every `/ai/<slug>`: nginx serves `/ai/view/index.html` for any path below `/ai/`. */
export default function ViewPage() {
  return (
    <Suspense fallback={null}>
      <ShareViewer />
    </Suspense>
  )
}
