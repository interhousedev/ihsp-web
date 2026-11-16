import { GuestViewer } from "../../features/admission-guest/guest-viewer"

export const dynamic = "force-static"

/** `/ai/admission-guest/#gst_…`: the token is in the fragment, so no server or log ever sees it. */
export default function AdmissionGuestPage() {
  return <GuestViewer />
}
