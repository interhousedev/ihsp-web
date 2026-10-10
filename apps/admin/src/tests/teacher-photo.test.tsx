/** Profile photo of a teacher: uploaded and removed on the teacher page; on the user page only for teachers. */
import { describe, expect, test } from "bun:test"
import {
  adminStudentUser,
  adminTeacherUser,
  adminUserDetail,
  apiUrl,
  ids,
  server,
  teacherPhotoUploads,
} from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TeacherProfilePage } from "../features/teachers/components/teacher-profile-page"
import { UserDetailPage } from "../features/users/components/user-detail-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const KALANDAROVA = "Kalandarova Gavxar"

describe("teacher profile photo", () => {
  test("uploads a PNG, shows it, and removes it again", async () => {
    const { user } = renderAdmin(<TeacherProfilePage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })
    await screen.findByRole("button", { name: "Save" })

    const input = await screen.findByLabelText("Photo")
    expect(screen.queryByRole("img", { name: `Photo of ${KALANDAROVA}` })).toBeNull()

    fireEvent.change(input, {
      target: { files: [new File([new Uint8Array(2048)], "kalandarova.png", { type: "image/png" })] },
    })

    const photo = await screen.findByRole("img", { name: `Photo of ${KALANDAROVA}` })
    expect(photo.getAttribute("src")).toContain("https://files.example.test/photos/")
    expect(teacherPhotoUploads()).toEqual([
      { owner: ids.teacherKalandarova, name: "kalandarova.png", type: "image/png", size: 2048 },
    ])

    await user.click(screen.getByRole("button", { name: "Remove photo" }))

    expect(await screen.findByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: `Photo of ${KALANDAROVA}` })).toBeNull()
  })

  test("a file that is not JPEG or PNG is refused before it is sent", async () => {
    renderAdmin(<TeacherProfilePage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })
    await screen.findByRole("button", { name: "Save" })

    fireEvent.change(await screen.findByLabelText("Photo"), {
      target: { files: [new File(["GIF89a"], "anim.gif", { type: "image/gif" })] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a JPEG or PNG image.")
    expect(teacherPhotoUploads()).toEqual([])
  })

  test("a rejected upload shows the server's message", async () => {
    server.use(
      http.put(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}/photo`), () =>
        HttpResponse.json(
          { type: "id/photo-too-large", title: "The photo is too large", status: 413 },
          { status: 413 },
        ),
      ),
    )
    renderAdmin(<TeacherProfilePage />, { route: `/teachers/view/?id=${ids.teacherKalandarova}` })
    await screen.findByRole("button", { name: "Save" })

    fireEvent.change(await screen.findByLabelText("Photo"), {
      target: { files: [new File([new Uint8Array(2048)], "kalandarova.jpg", { type: "image/jpeg" })] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("The photo is larger than 5 MB.")
  })
})

describe("user page photo", () => {
  test("a teacher's user page has the photo field", async () => {
    server.use(
      http.get(apiUrl(`/v1/admin/users/${ids.teacherKalandarova}`), () =>
        HttpResponse.json({ ...adminUserDetail, ...adminTeacherUser, telegram: [], sessions: [], recent_audit: [] }),
      ),
    )
    renderAdmin(<UserDetailPage />, { route: `/users/view/?id=${ids.teacherKalandarova}` })

    expect(await screen.findByRole("button", { name: "Upload photo" })).toBeInTheDocument()
  })

  test("a student's user page has no photo field", async () => {
    renderAdmin(<UserDetailPage />, { route: `/users/view/?id=${adminStudentUser.id}` })

    expect(await screen.findByRole("button", { name: "Set password" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Upload photo" })).toBeNull()
  })
})
