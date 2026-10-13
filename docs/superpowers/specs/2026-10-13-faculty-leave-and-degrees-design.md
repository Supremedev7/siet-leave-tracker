# Faculty Leave Application, Degrees Field & HOD Naming — Design Spec

## Overview

Three interconnected enhancements to the SIET Leave Tracker:

1. **Faculty Leave Application** — Faculty can apply for leaves (Medical, Personal, Half-Day, Emergency) that are approved directly by the Head of the Department (HOD Mam). Separate from the existing student leave approval workflow.
2. **Degrees Field** — Add a comma-separated degrees field to Faculty and HOD registration and profiles, displayed as tag chips.
3. **HOD Naming** — Rename all instances of "Department Head" to "Head of the Department" across the application.

---

## Data Model

### UserData Changes (AuthContext + Firestore `users` collection)

Add to the `UserData` interface:
```typescript
degrees?: string; // Comma-separated, e.g. "M.Tech, Ph.D, B.Tech"
```

Applies to: `role === "faculty"` and `role === "hod"`.

### New Collection: `facultyLeaveRequests`

Separate from `leaveRequests` (student leaves) for clean separation of concerns.

```typescript
interface FacultyLeaveRequest {
  id: string;
  facultyUid: string;
  facultyName: string;
  employeeId: string;
  department: string;
  designation?: string;
  type: "Medical" | "Personal" | "Half-Day" | "Emergency";
  startDate: Timestamp;
  endDate: Timestamp;
  totalDays: number;
  reason: string;
  emergencyPhone: string;
  attachmentUrl?: string | null;
  status: "pending_hod" | "approved" | "rejected" | "cancelled";
  hodRemarks?: string;
  approvedByUid?: string;
  approvedByName?: string;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Rules Addition

```
match /facultyLeaveRequests/{leaveId} {
  allow read: if request.auth != null && (
    resource.data.facultyUid == request.auth.uid ||
    isHOD() ||
    isAdmin()
  );
  allow create: if request.auth != null && isFaculty() &&
    request.resource.data.facultyUid == request.auth.uid;
  allow update: if request.auth != null && (
    (resource.data.facultyUid == request.auth.uid && request.resource.data.status == "cancelled") ||
    isHOD() ||
    isAdmin()
  );
  allow delete: if isAdmin();
}
```

---

## Pages & Routes

### Faculty — New Pages

| Page | Route | Description |
|------|-------|-------------|
| `FacultyApplyLeave.tsx` | `/faculty/apply-leave` | Leave application form — mirrors student form structure |
| `FacultyMyLeaves.tsx` | `/faculty/my-leaves` | View own leave history, status tracking, cancel pending |

### HOD — New Page

| Page | Route | Description |
|------|-------|-------------|
| `HodFacultyApprovals.tsx` | `/hod/faculty-approvals` | Approve/reject faculty leave requests |

### Navigation Changes (Menubar.tsx)

**Faculty nav items** — add between "Review Archive" and "Faculty Profile":
- "Apply Leave" → `/faculty/apply-leave` (icon: `FilePlus2`)
- "My Leaves" → `/faculty/my-leaves` (icon: `History`)

**HOD nav items** — add between "Leave Archive" and "Faculty Allocation":
- "Faculty Leaves" → `/hod/faculty-approvals` (icon: `CheckSquare`)

---

## Registration Changes (Signup.tsx)

When `role === "faculty"` or `role === "hod"`:
- Add a text input field labeled "Degrees / Qualifications"
- Placeholder: "e.g. M.Tech, Ph.D, B.Tech"
- Validation: optional but recommended (no strict validation)
- Saved as: `degrees: string` in the Firestore user document

---

## Profile Changes

### FacultyProfile.tsx
- Add degrees display as tag chips
- Add editable contact section (phone, matching HOD profile pattern)
- Add password management section

### HodProfile.tsx
- Add degrees display as tag chips in the identity card section
- Rename "Department Head Profile" → "Head of the Department Profile"
- Rename "Department Head" → "Head of the Department" in the identity card

---

## Naming Convention Changes

All references to "Department Head" throughout the codebase must be changed to "Head of the Department":
- `HodProfile.tsx`: page title, identity card badge text
- `Menubar.tsx`: any HOD-related labels (currently correct as "HOD Profile")
- Any other pages that reference "Department Head"

---

## Approval Flow

```
Faculty submits leave → Status: "pending_hod"
  ↓
HOD Mam reviews:
  → Approve: Status changes to "approved"
  → Reject: Status changes to "rejected"

Faculty can cancel own pending requests: Status → "cancelled"
```

No escalation to Admin. HOD Mam is the final authority for faculty leaves.
