import { describe, expect, it } from "bun:test"
import { addPhotos, makePhoto, movePhoto, rotatePhoto } from "./photo-items"
import { fitWithin, jpegName, prepareImage } from "./prepare-image"

const image = (name: string) => new File(["x"], name, { type: "image/jpeg" })
const photos = (...names: string[]) => names.map((name) => makePhoto(image(name)))

describe("photo list", () => {
  it("adds photos after the existing ones and keeps at most 20", () => {
    const first = addPhotos(
      [],
      Array.from({ length: 18 }, (_, i) => image(`a${i}.jpg`)),
      20,
    )
    const second = addPhotos(first.photos, [image("b0.jpg"), image("b1.jpg"), image("b2.jpg")], 20)

    expect(first.dropped).toBe(0)
    expect(second.photos).toHaveLength(20)
    expect(second.dropped).toBe(1)
    expect(second.photos.at(-1)?.file.name).toBe("b1.jpg")
  })

  it("ignores files that are not images", () => {
    const result = addPhotos([], [new File(["x"], "notes.txt", { type: "text/plain" }), image("p.jpg")], 20)

    expect(result.photos.map((photo) => photo.file.name)).toEqual(["p.jpg"])
  })

  it("moves a photo to a new place", () => {
    const list = photos("a.jpg", "b.jpg", "c.jpg")

    expect(movePhoto(list, 0, 2).map((p) => p.file.name)).toEqual(["b.jpg", "c.jpg", "a.jpg"])
    expect(movePhoto(list, 2, 1).map((p) => p.file.name)).toEqual(["a.jpg", "c.jpg", "b.jpg"])
    expect(movePhoto(list, 0, 5).map((p) => p.file.name)).toEqual(["a.jpg", "b.jpg", "c.jpg"])
  })

  it("turns a photo by 90 degrees and comes back after four turns", () => {
    let list = photos("a.jpg", "b.jpg")
    const key = list[1]!.key

    list = rotatePhoto(list, key)
    expect(list.map((p) => p.rotation)).toEqual([0, 90])
    for (let i = 0; i < 3; i += 1) list = rotatePhoto(list, key)
    expect(list.map((p) => p.rotation)).toEqual([0, 0])
  })
})

describe("prepareImage", () => {
  it("scales the longest side down to the limit and never enlarges", () => {
    expect(fitWithin(4800, 3600, 2400)).toEqual({ width: 2400, height: 1800 })
    expect(fitWithin(3000, 6000, 2400)).toEqual({ width: 1200, height: 2400 })
    expect(fitWithin(800, 600, 2400)).toEqual({ width: 800, height: 600 })
  })

  it("names the converted file .jpg", () => {
    expect(jpegName("IMG_0042.HEIC")).toBe("IMG_0042.jpg")
    expect(jpegName("scan")).toBe("scan.jpg")
  })

  it("returns the original file when a canvas cannot decode it (no canvas in the test environment)", async () => {
    const file = image("p.jpg")

    expect(await prepareImage(file, 90)).toBe(file)
  })
})
