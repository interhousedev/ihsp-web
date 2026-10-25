import { describe, expect, test } from "bun:test"
import { previewImageSrc } from "../features/settings/components/image-crop-field"

describe("previewImageSrc", () => {
  test("keeps this page's blob: object URLs and inline image data URLs", () => {
    expect(previewImageSrc("blob:https://lms.ihsu.uz/3f2c-9a")).toBe("blob:https://lms.ihsu.uz/3f2c-9a")
    expect(previewImageSrc("data:image/png;base64,iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=")
    expect(previewImageSrc("DATA:IMAGE/JPEG,AAAA")).toBe("DATA:IMAGE/JPEG,AAAA")
  })

  test("drops every other scheme and any address that is not a URL of an image", () => {
    for (const url of [
      "javascript:alert(1)",
      "https://evil.example/x.png",
      "//evil.example/x.png",
      "data:text/html,<script>alert(1)</script>",
      "data:image.svg,<svg onload=alert(1)>",
      "/relative.png",
      "",
    ]) {
      expect(previewImageSrc(url)).toBeUndefined()
    }
  })
})
