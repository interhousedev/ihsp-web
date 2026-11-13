import { Suspense } from "react"
import { CardViewer } from "../../features/card/card-viewer"

export const dynamic = "force-static"

/** `/ai/card/?t=<token>`: the student card a QR code opens. */
export default function CardPage() {
  return (
    <Suspense fallback={null}>
      <CardViewer />
    </Suspense>
  )
}
