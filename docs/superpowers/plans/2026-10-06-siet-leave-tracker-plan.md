# SIET Leave Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready leave tracking web app for students and HODs of SIET.

**Architecture:** A React SPA with Firebase Auth, Firestore, and Storage. Contains separate views for students (apply leave, history) and HODs (approve leave, analytics). Styled with Tailwind and shadcn/ui.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Firebase, Recharts, React Router v6.

**Spec:** `docs/superpowers/specs/2026-10-06-siet-leave-tracker-design.md`

## Global Constraints

- Web App Framework: React 18 (Vite) + TypeScript.
- Styling: Tailwind CSS v3 + shadcn/ui (No Tailwind v4 yet).
- BaaS: Firebase (Auth, Firestore, Storage).
- UI Guidelines: Professional, clean, no purple, no gradients, maroon/crimson branding (`#8B1A1A`).
- Domain Restriction: Authentication strictly limited to `@sriniet.edu.in`.
- Data: No dummy data in production mode.

---

### Task 1: Project Setup and Dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

**Interfaces:**
- Produces: Initialized Vite React project with Tailwind and shadcn/ui.

- [ ] **Step 1: Scaffold Vite Project**
```bash
npx create-vite@latest . --template react-ts --yes
```

- [ ] **Step 2: Install core dependencies**
```bash
npm install firebase react-router-dom react-hook-form @hookform/resolvers zod date-fns recharts lucide-react clsx tailwind-merge
```

- [ ] **Step 3: Setup Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Update `tailwind.config.js` to include the primary colors (`#8B1A1A`) and paths to `src/**/*.{ts,tsx}`.

- [ ] **Step 4: Initialize shadcn/ui**
```bash
npx shadcn-ui@latest init
```
(Select Default style, Neutral base color, CSS variables, answer yes to all).

- [ ] **Step 5: Setup Firebase Configuration File**
Create `src/lib/firebase.ts` with placeholder config (to be replaced with actual env vars).

- [ ] **Step 6: Configure Global CSS**
Add the SIET color palette as CSS variables in `src/index.css`.

- [ ] **Step 7: Commit**
```bash
git add .
git commit -m "chore: initial project setup with vite, tailwind, shadcn, and firebase"
```

### Task 2: Authentication and Routing Context

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/routes/AppRouter.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `useAuth` hook, protected routing structure.

- [ ] **Step 1: Create Auth Context**
Implement `AuthContext.tsx` that uses Firebase `onAuthStateChanged` and fetches the user document from Firestore to determine if they are a student or HOD.

- [ ] **Step 2: Create AppRouter**
Define routes for `/login`, `/signup`, `/student/*`, and `/hod/*`. Include a `ProtectedRoute` component that checks auth state and role.

- [ ] **Step 3: Integrate with App**
Wrap `App.tsx` with `AuthProvider` and mount `AppRouter`.

- [ ] **Step 4: Commit**
```bash
git add src/contexts src/routes src/App.tsx
git commit -m "feat: auth context and basic routing"
```

### Task 3: Authentication Views (Login & Signup)

**Files:**
- Create: `src/pages/auth/Login.tsx`
- Create: `src/pages/auth/Signup.tsx`
- Create: `src/components/ui/button.tsx` (via shadcn)
- Create: `src/components/ui/input.tsx` (via shadcn)
- Create: `src/components/ui/form.tsx` (via shadcn)

**Interfaces:**
- Consumes: Firebase Auth API, `useAuth`.
- Produces: Working login and signup screens restricted to `@sriniet.edu.in`.

- [ ] **Step 1: Add required shadcn components**
```bash
npx shadcn-ui@latest add button input form select card
```

- [ ] **Step 2: Build Signup View**
Create a form that asks for Role (Student/HOD).
If Student: Name, Roll Number, Year, Semester, Section, Dept, Phone.
If HOD: Name, Employee ID, Dept, Phone.
Validate domain: `email.endsWith('@sriniet.edu.in')`.
Create Firebase Auth user, then create Firestore `users/{uid}` document.

- [ ] **Step 3: Build Login View**
Simple Email/Password form. Upon login, redirect to `/student/dashboard` or `/hod/dashboard` based on role.

- [ ] **Step 4: Commit**
```bash
git add src/pages/auth src/components/ui
git commit -m "feat: login and signup screens with domain validation"
```

### Task 4: Student Portal - Dashboard & Leave Application

**Files:**
- Create: `src/pages/student/Dashboard.tsx`
- Create: `src/pages/student/ApplyLeave.tsx`
- Create: `src/pages/student/LeaveHistory.tsx`
- Create: `src/components/layout/StudentLayout.tsx`
- Create: `src/lib/firestore/leaves.ts`

**Interfaces:**
- Consumes: Firestore `leaveRequests` collection.
- Produces: Student ability to apply for leaves and view their history.

- [ ] **Step 1: Add required shadcn components**
```bash
npx shadcn-ui@latest add table badge textarea calendar popover
```

- [ ] **Step 2: Student Layout**
Create a sidebar/navbar layout for student navigation.

- [ ] **Step 3: Apply Leave Form**
Form with fields: Leave Type, Date Range, Reason. Write to Firestore `leaveRequests` collection with `status: "pending"`.

- [ ] **Step 4: Leave History & Dashboard**
Fetch leaves where `studentId == currentUser.uid`. Display in a table. Show summary cards (Total pending, approved, rejected).

- [ ] **Step 5: Commit**
```bash
git add src/pages/student src/components/layout src/lib/firestore
git commit -m "feat: student portal and leave application"
```

### Task 5: HOD Dashboard - Review & Analytics

**Files:**
- Create: `src/pages/hod/Dashboard.tsx`
- Create: `src/pages/hod/PendingRequests.tsx`
- Create: `src/pages/hod/AllRequests.tsx`
- Create: `src/components/layout/HodLayout.tsx`

**Interfaces:**
- Consumes: Firestore `leaveRequests` where `department == hod.department`.
- Produces: HOD ability to review leaves and view analytics.

- [ ] **Step 1: HOD Layout**
Create a layout specific to the HOD role.

- [ ] **Step 2: Pending Requests Review**
Fetch leaves where `department == currentUser.department` and `status == "pending"`. Build a UI to approve/reject with optional remarks.

- [ ] **Step 3: Analytics Dashboard**
Use `recharts` to build:
1. Bar chart of leaves by type.
2. Donut chart of approval/rejection rate.
Display data fetched from Firestore.

- [ ] **Step 4: Commit**
```bash
git add src/pages/hod src/components/layout
git commit -m "feat: HOD review portal and analytics"
```

### Task 6: UI Polish and Branding

**Files:**
- Modify: `src/index.css`
- Create: `src/components/branding/Logo.tsx`

**Interfaces:**
- Consumes: SIET Brand colors.
- Produces: Final production-ready UI polish.

- [ ] **Step 1: Apply SIET colors**
Ensure all buttons, active states, and headers use `#8B1A1A`.

- [ ] **Step 2: Add SIET Logo & Typography**
Include the SIET logo in the navigation bars. Ensure typography is clean (e.g., Inter or Roboto).

- [ ] **Step 3: Commit**
```bash
git add src/index.css src/components/branding
git commit -m "style: apply SIET branding and polish"
```
