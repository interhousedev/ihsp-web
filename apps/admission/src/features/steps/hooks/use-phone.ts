import { useEffect, useState } from "react"

/** True below the 768 px breakpoint where the sidebar becomes a sheet; false until the client has measured. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)")
    const sync = () => setPhone(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])
  return phone
}
