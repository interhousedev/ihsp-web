/** ADM-PHOTO-1, ADM-PHOTO-2: the student photo dialog (camera, file) and the group photo ZIP. */
import { afterEach, describe, expect, test } from "bun:test"
import { groupPhotoExports, ids, studentItems, teacherPhotoUploads } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { GroupDetailPage } from "../features/groups/components/group-detail-page"
import { StudentsPage } from "../features/students/components/students-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices")

function setMediaDevices(value: unknown) {
  Object.defineProperty(navigator, "mediaDevices", { value, configurable: true })
}

afterEach(() => {
  if (originalMediaDevices) Object.defineProperty(navigator, "mediaDevices", originalMediaDevices)
  else Reflect.deleteProperty(navigator, "mediaDevices")
})

/** Opens the photo dialog of the first student in the list. */
async function openFirstPhotoDialog(user: { click: (element: Element) => Promise<unknown> }) {
  const buttons = await screen.findAllByRole("button", { name: "Photo" })
  await user.click(buttons[0]!)
  return screen.findByRole("dialog")
}

describe("student photo dialog", () => {
  test("a picked file is uploaded to that student's account", async () => {
    const { user } = renderAdmin(<StudentsPage />, { route: "/students/" })
    const dialog = await openFirstPhotoDialog(user)

    fireEvent.change(within(dialog).getByLabelText("Choose a file"), {
      target: { files: [new File([new Uint8Array(2048)], "student.png", { type: "image/png" })] },
    })
    await user.click(await within(dialog).findByRole("button", { name: "Upload photo" }))

    await waitFor(() => expect(teacherPhotoUploads()).toHaveLength(1))
    const uploads = teacherPhotoUploads()
    expect(studentItems.map((student) => student.user_id)).toContain(uploads[0]!.owner)
    expect(uploads[0]).toMatchObject({ name: "student.png", type: "image/png", size: 2048 })
  })

  test("a file that is not JPEG or PNG is refused before it is sent", async () => {
    const { user } = renderAdmin(<StudentsPage />, { route: "/students/" })
    const dialog = await openFirstPhotoDialog(user)

    fireEvent.change(within(dialog).getByLabelText("Choose a file"), {
      target: { files: [new File(["GIF89a"], "anim.gif", { type: "image/gif" })] },
    })

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Choose a JPEG or PNG image.")
    expect(teacherPhotoUploads()).toEqual([])
  })

  test("without a camera API the dialog says so and keeps the file picker", async () => {
    setMediaDevices(undefined)
    const { user } = renderAdmin(<StudentsPage />, { route: "/students/" })
    const dialog = await openFirstPhotoDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Take photo" }))

    expect(
      await within(dialog).findByText("The camera is not available here. Choose a photo file instead."),
    ).toBeTruthy()
    expect(within(dialog).getByLabelText("Choose a file").getAttribute("capture")).toBe("user")
  })

  test("a refused camera falls back to the file picker", async () => {
    setMediaDevices({
      getUserMedia: async () => {
        throw new DOMException("Permission denied", "NotAllowedError")
      },
    })
    const { user } = renderAdmin(<StudentsPage />, { route: "/students/" })
    const dialog = await openFirstPhotoDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Take photo" }))

    expect(await within(dialog).findByText(/Camera access was denied/)).toBeTruthy()
    expect(within(dialog).getByRole("button", { name: "Choose a file" })).toBeTruthy()
  })

  test("closing the dialog stops every camera track", async () => {
    const srcObject = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "srcObject")
    Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
      configurable: true,
      get: () => null,
      set: () => undefined,
    })
    const stopped: string[] = []
    const stream = {
      getTracks: () => [{ stop: () => stopped.push("track") }],
    }
    setMediaDevices({ getUserMedia: async () => stream })
    const { user } = renderAdmin(<StudentsPage />, { route: "/students/" })
    const dialog = await openFirstPhotoDialog(user)

    await user.click(within(dialog).getByRole("button", { name: "Take photo" }))
    expect(await within(dialog).findByLabelText("Camera preview")).toBeTruthy()

    await user.click(within(dialog).getByRole("button", { name: "Close" }))

    expect(stopped).toEqual(["track"])
    if (srcObject) Object.defineProperty(HTMLMediaElement.prototype, "srcObject", srcObject)
    else Reflect.deleteProperty(HTMLMediaElement.prototype, "srcObject")
  })
})

describe("group photo export", () => {
  test("the group page downloads the ZIP of the group's photos", async () => {
    const created: unknown[] = []
    const realCreate = URL.createObjectURL
    URL.createObjectURL = (blob: Blob) => {
      created.push(blob)
      return "blob:photos"
    }
    try {
      const { user } = renderAdmin(<GroupDetailPage />, { route: `/groups/view/?id=${ids.group2TN2}` })

      await user.click(await screen.findByRole("button", { name: "Export photos" }))

      await screen.findByRole("button", { name: "Export photos" })
      expect(groupPhotoExports).toContain(ids.group2TN2)
      expect(created).toHaveLength(1)
    } finally {
      URL.createObjectURL = realCreate
    }
  })
})
