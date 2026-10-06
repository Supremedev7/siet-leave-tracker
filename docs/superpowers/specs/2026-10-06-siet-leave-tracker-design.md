# SIET Leave Tracker — Architectural Design

## System Overview
A production-grade leave management system for **Srinivasa Institute of Engineering and Technology, Cheyyeru** where students submit leave applications and HODs review, approve/reject them with full analytics.

## Section 1: Authentication & Registration

- **Provider**: Firebase Auth (Email/Password) — restricted to `@sriniet.edu.in` domain.
- During signup: user selects role (Student / HOD).
- **Students** fill: Name, Roll Number, Year (1-4), Semester, Section, Department, Phone.
- **HODs** fill: Name, Employee ID, Department (they manage), Phone.
- HOD accounts require **email verification** before they can approve leaves.
- Login/Logout with persistent session via Firebase Auth state observer.

## Section 2: Database Schema (Firestore)

```javascript
users/{uid}
  // Base fields
  email: string
  name: string
  role: "student" | "hod"
  department: string // "CSE" | "ECE" | "EEE" | "ME" | "CE" | "S&H"
  phone: string
  createdAt: timestamp
  
  // Student fields (if role === "student")
  rollNumber: string
  year: number
  semester: number
  section: string
  
  // HOD fields (if role === "hod")
  employeeId: string

leaveRequests/{docId}
  studentId: string
  studentName: string
  rollNumber: string
  department: string
  year: number
  section: string
  leaveType: "medical" | "personal" | "od" | "halfday" | "emergency"
  fromDate: timestamp
  toDate: timestamp
  totalDays: number
  reason: string
  attachmentUrl: string | null // optional - for medical certificates
  status: "pending" | "approved" | "rejected"
  hodId: string | null
  hodRemarks: string | null
  reviewedAt: timestamp | null
  createdAt: timestamp
  updatedAt: timestamp
```

## Section 3: Student Portal

- **Apply Leave**: Form with leave type, date range, reason, optional file upload (medical certificate to Firebase Storage).
- **My Leaves**: Table of all submitted leaves with status badges (Pending ⏳ / Approved ✅ / Rejected ❌), filterable by status/type/date.
- **Leave Balance**: Visual display of leaves taken per category.
- **Profile**: View/edit profile info.

## Section 4: HOD Dashboard

- **Pending Requests**: Live-updating list of pending leaves from their department. Approve/Reject with remarks.
- **All Requests**: Full history with filters (student, type, status, date range).
- **Analytics Dashboard**:
  - Leave counts by type (bar chart).
  - Approval/rejection rate (donut chart).
  - Monthly trends (line chart).
  - Department attendance % indicator.
  - Calendar heatmap showing leave density per day.
  - Student-wise summary table.

## Section 5: Visual Identity & Color Palette

Extracted from the SIET logo — maroon/crimson institutional branding:

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#8B1A1A` | Maroon — headers, primary buttons, nav |
| Primary Dark | `#6B1414` | Hover states, active elements |
| Primary Light | `#A52A2A` | Accents, badges |
| Neutral 50 | `#FAFAF9` | Page background |
| Neutral 100 | `#F5F5F4` | Card backgrounds |
| Neutral 200 | `#E7E5E4` | Borders |
| Neutral 700 | `#44403C` | Body text |
| Neutral 900 | `#1C1917` | Headings |
| Success | `#16A34A` | Approved status |
| Warning | `#D97706` | Pending status |
| Destructive | `#DC2626` | Rejected status |

No purple. No gradients. Clean, institutional, flat design with subtle shadows.

## Section 6: Tech Stack

- **React 18** (Vite) + **TypeScript**
- **Tailwind CSS v3** + **shadcn/ui** components
- **Firebase**: Auth, Firestore, Storage, Hosting
- **Recharts** for analytics charts
- **React Router v6** for routing
- **React Hook Form + Zod** for form validation
- **date-fns** for date utilities
- **Lucide React** icons (shadcn default)

## Section 7: Security Rules (Firestore)

- Students can only read/write their own leave requests.
- HODs can only read/update requests from their department.
- No client-side deletion of leave requests.
- Email domain validation server-side via Firebase Auth blocking function (if feasible) or strictly enforced on client & rules.
