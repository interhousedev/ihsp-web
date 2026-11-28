import type { MyGroup } from "@ihsp/api"
import { ids } from "./world"

const homeroom = {
  id: ids.teacherRakhimov,
  first_name: "Dilnoza",
  last_name: "Rakhimova",
  photo_url: "https://files.example.test/faces/rakhimova.jpg",
  contacts: {
    telegram: "dilnoza_r",
    email: null,
    phone: null,
    office_hours: "Mon 14:00-15:00",
    office: "204",
    note: null,
  },
}

/** `GET /v1/me/group` for the demo student, who is the head student of the group. */
export const myGroupForHead: MyGroup = {
  id: ids.group2TN2,
  name: "2TN2",
  size: 4,
  is_head_student: true,
  homeroom_teacher: homeroom,
  head_student: {
    id: ids.student,
    first_name: "Demo",
    last_name: "Student",
    photo_url: null,
    full_name: "Demo Student",
  },
  group: { id: ids.group2TN2, name: "2TN2", course: 2 },
  curator: null,
  members_count: 4,
  top_by_grade: [],
  top_by_attendance: [],
  ranks: { course: { gpa: null, attendance: null }, lyceum: { gpa: null, attendance: null } },
  members: [
    {
      id: ids.student2,
      first_name: "Aziza",
      last_name: "Karimova",
      photo_url: "https://files.example.test/faces/karimova.jpg",
      is_head_student: false,
      is_me: false,
    },
    { id: ids.student, first_name: "Demo", last_name: "Student", photo_url: null, is_head_student: true, is_me: true },
    {
      id: ids.student3,
      first_name: "Bobur",
      last_name: "Rashidov",
      photo_url: null,
      is_head_student: false,
      is_me: false,
    },
    {
      id: ids.student4,
      first_name: "Malika",
      last_name: "Sadykova",
      photo_url: null,
      is_head_student: false,
      is_me: false,
    },
  ],
}

/** The same group for a plain member: the head is a classmate, so no marks table. */
export const myGroupForMember: MyGroup = {
  ...myGroupForHead,
  is_head_student: false,
  head_student: {
    id: ids.student2,
    first_name: "Aziza",
    last_name: "Karimova",
    photo_url: null,
    full_name: "Aziza Karimova",
  },
  members: myGroupForHead.members.map((m) => ({
    ...m,
    is_head_student: m.id === ids.student2,
  })),
}

/** A group with no homeroom teacher and no head student yet. */
export const myGroupUnassigned: MyGroup = {
  ...myGroupForMember,
  homeroom_teacher: null,
  head_student: null,
  members: myGroupForMember.members.map((m) => ({ ...m, is_head_student: false })),
}
