import { beforeEach, describe, expect, it } from "bun:test"
import { fireEvent, screen, within } from "@testing-library/react"
import { useState } from "react"
import { renderLibrary } from "../test-support"
import type { PhotoItem } from "./material-values"
import { PhotoPicker } from "./photo-picker"

/** The photos as the last `onChange` reported them. */
const seen = { photos: [] as PhotoItem[] }

function Harness() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  return (
    <PhotoPicker
      photos={photos}
      onChange={(next) => {
        seen.photos = next
        setPhotos(next)
      }}
    />
  )
}

const image = (name: string) => new File([`bytes of ${name}`], name, { type: "image/jpeg" })
const add = (...names: string[]) =>
  fireEvent.change(screen.getByTestId("photo-camera-input"), { target: { files: names.map(image) } })
const order = () => seen.photos.map((photo) => photo.file.name)

describe("PhotoPicker", () => {
  beforeEach(() => {
    seen.photos = []
  })

  it("opens the camera first (capture) and also offers the gallery", () => {
    renderLibrary(<Harness />)

    const camera = screen.getByTestId("photo-camera-input")
    expect(camera).toHaveAttribute("accept", "image/*")
    expect(camera).toHaveAttribute("capture", "environment")
    expect(camera).toHaveAttribute("multiple")
    expect(screen.getByTestId("photo-gallery-input")).not.toHaveAttribute("capture")
    expect(screen.getByRole("button", { name: "Take a photo" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Choose from gallery" })).toBeInTheDocument()
    expect(screen.getByText(/No cropping here/)).toBeInTheDocument()
  })

  it("adds several shots one after another and numbers them", () => {
    renderLibrary(<Harness />)

    add("a.jpg", "b.jpg")
    add("c.jpg")

    expect(order()).toEqual(["a.jpg", "b.jpg", "c.jpg"])
    const list = screen.getByRole("list", { name: "Photos in order" })
    expect(within(list).getAllByRole("listitem")).toHaveLength(3)
    expect(within(list).getByText("Photo 3 of 3")).toBeInTheDocument()
    expect(screen.getByTestId("photo-count")).toHaveTextContent("3 of 20 photos")
    expect(screen.getByRole("button", { name: "Take another photo" })).toBeInTheDocument()
  })

  it("reorders with the move buttons and announces the new place", async () => {
    const { user } = renderLibrary(<Harness />)
    add("a.jpg", "b.jpg", "c.jpg")

    await user.click(screen.getByRole("button", { name: "Move photo 3 up" }))
    expect(order()).toEqual(["a.jpg", "c.jpg", "b.jpg"])
    expect(screen.getByText("Photo 3 moved to position 2 of 3.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Move photo 1 down" }))
    expect(order()).toEqual(["c.jpg", "a.jpg", "b.jpg"])
    expect(screen.getByRole("button", { name: "Move photo 1 up" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Move photo 3 down" })).toBeDisabled()
  })

  it("reorders from the keyboard with Alt and an arrow key on the handle", () => {
    renderLibrary(<Harness />)
    add("a.jpg", "b.jpg", "c.jpg")

    const handle = screen.getByRole("button", { name: "Drag photo 1 to change its place" })
    handle.focus()
    fireEvent.keyDown(handle, { key: "ArrowDown", altKey: true })

    expect(order()).toEqual(["b.jpg", "a.jpg", "c.jpg"])
  })

  it("turns a photo by 90 degrees each time and removes a photo", async () => {
    const { user } = renderLibrary(<Harness />)
    add("a.jpg", "b.jpg")

    await user.click(screen.getByRole("button", { name: "Turn photo 2 by 90 degrees" }))
    await user.click(screen.getByRole("button", { name: "Turn photo 2 by 90 degrees" }))
    expect(seen.photos.map((photo) => photo.rotation)).toEqual([0, 180])

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }))
    expect(order()).toEqual(["b.jpg"])
    expect(seen.photos[0]?.rotation).toBe(180)
  })

  it("keeps at most 20 photos and says how many did not fit", () => {
    renderLibrary(<Harness />)

    add(...Array.from({ length: 22 }, (_, i) => `p${i}.jpg`))

    expect(seen.photos).toHaveLength(20)
    expect(screen.getByTestId("photo-count")).toHaveTextContent("20 of 20 photos")
    expect(screen.getByRole("alert")).toHaveTextContent("Only 20 photos fit. 2 more were not added.")
    expect(screen.getByRole("button", { name: "Take another photo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Choose from gallery" })).toBeDisabled()
  })
})
