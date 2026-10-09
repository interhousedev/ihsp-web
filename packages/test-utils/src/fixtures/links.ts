import type { LinkItem, ModerationItem, ResourceItem } from "@ihsp/api"
import { fileImage, filePdf } from "./files"
import { ids, persons } from "./world"

export const linkUrl: LinkItem = {
  id: ids.link,
  slug: "a1b2c3",
  kind: "url",
  url: "http://localhost:8000/s/a1b2c3",
  target_url: "https://www.khanacademy.org/science/physics",
  file: null,
  title: "Khan Academy: physics",
  lesson_id: null,
  target_id: null,
  share_mode: null,
  hits: 12,
  created_at: "2026-09-25T09:00:00Z",
  expires_at: null,
  revoked_at: null,
  disabled: false,
}

export const linkFile: LinkItem = {
  ...linkUrl,
  id: "00000009-0000-4000-8000-000000000003",
  slug: "d4e5f6",
  kind: "file",
  url: "http://localhost:8000/s/d4e5f6",
  target_url: null,
  file: fileImage,
  title: "lab-setup.jpg",
  hits: 3,
}

/** A public share of an assistant chat (snapshot). */
export const linkChatShare: LinkItem = {
  id: ids.linkChat,
  slug: "kq7x2m9a",
  kind: "chat",
  url: "http://localhost:3006/ai/kq7x2m9a",
  target_url: null,
  file: null,
  title: "Kinematics revision",
  lesson_id: null,
  target_id: ids.chat,
  share_mode: "snapshot",
  hits: 5,
  created_at: "2026-10-02T14:00:00Z",
  expires_at: "2026-11-01T14:00:00Z",
  revoked_at: null,
  disabled: false,
}

export const linkFlashcardShare: LinkItem = {
  ...linkChatShare,
  id: "00000009-0000-4000-8000-000000000004",
  slug: "zr5t8w1c",
  kind: "flashcard_set",
  url: "http://localhost:3006/ai/zr5t8w1c",
  title: "Physics: kinematics",
  target_id: ids.flashcardSet,
  share_mode: "live",
  expires_at: null,
}

export const linkRevoked: LinkItem = {
  ...linkUrl,
  id: "00000009-0000-4000-8000-000000000005",
  slug: "old123",
  title: "Old link",
  revoked_at: "2026-09-30T10:00:00Z",
}

export const linkItems: LinkItem[] = [linkUrl, linkFile, linkChatShare, linkFlashcardShare, linkRevoked]

export const resourceMaterial: ResourceItem = {
  link_id: ids.link,
  lesson_id: ids.lessonPhysicsToday,
  role: "material",
  kind: "url",
  short_url: "http://localhost:8000/s/a1b2c3",
  title: "Khan Academy: physics",
  author: persons.kalandarova,
  hidden: false,
  file: null,
  created_at: "2026-10-05T13:00:00Z",
  source: "user",
}

export const resourceMaterialFile: ResourceItem = {
  link_id: "00000009-0000-4000-8000-000000000006",
  lesson_id: ids.lessonPhysicsToday,
  role: "material",
  kind: "file",
  short_url: "http://localhost:8000/s/g7h8i9",
  title: "kinematics-notes.pdf",
  author: persons.kalandarova,
  hidden: false,
  file: filePdf,
  created_at: "2026-10-05T13:05:00Z",
  source: "user",
}

/** An attachment a student added to the lesson. */
export const resourceAttachment: ResourceItem = {
  link_id: "00000009-0000-4000-8000-000000000007",
  lesson_id: ids.lessonPhysicsToday,
  role: "attachment",
  kind: "url",
  short_url: "http://localhost:8000/s/j1k2l3",
  title: "Worked example on YouTube",
  author: persons.student,
  hidden: false,
  file: null,
  created_at: "2026-10-06T16:00:00Z",
  source: "user",
}

/** A material EMIS brought: authored by "EMIS" and labelled in the UI (kept out of `resourceItems`). */
export const resourceFromEmis: ResourceItem = {
  link_id: "00000009-0000-4000-8000-000000000008",
  lesson_id: ids.lessonPhysicsToday,
  role: "material",
  kind: "url",
  short_url: "http://localhost:8000/s/m4n5o6",
  title: "Kinematics (video)",
  author: { id: "00000000-0000-0000-0000-00000000e015", first_name: "EMIS", last_name: "" },
  hidden: false,
  file: null,
  created_at: "2026-10-06T03:00:00Z",
  source: "emis",
}

export const resourceItems: ResourceItem[] = [resourceMaterial, resourceMaterialFile, resourceAttachment]

export const moderationItems: ModerationItem[] = [
  {
    link: {
      ...linkUrl,
      id: "00000009-0000-4000-8000-000000000008",
      slug: "bad999",
      title: "Free exam answers",
      target_url: "https://example.org/answers",
    },
    owner: { id: ids.student2, first_name: "Jasur", last_name: "Ismoilov" },
    reports: 3,
    last_reported_at: "2026-10-06T18:30:00Z",
    disabled_reason: null,
  },
  {
    link: { ...linkChatShare, id: "00000009-0000-4000-8000-000000000009", slug: "chat777", disabled: true },
    owner: persons.student,
    reports: 1,
    last_reported_at: "2026-10-04T12:00:00Z",
    disabled_reason: "personal_data",
  },
]
