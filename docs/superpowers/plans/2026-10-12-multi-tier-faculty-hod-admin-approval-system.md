# Multi-Tier Faculty-HOD-Admin Leave Approval System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an institutional 4-tier leave approval system for SIET (Student → Faculty Class Advisor → HOD → Admin/Principal) with duration-based escalation rules (1-2 days faculty decision, 3-5 days HOD decision, 6+ days Admin decision) and comprehensive portals for all 4 roles.

**Architecture:** Extend existing React 18 + Vite SPA and Firebase architecture. Introduce shared TypeScript domain interfaces (`LeaveRequest`, `ApprovalChainEntry`, `UserData`), modify Firestore security rules and AuthContext to support 4 user roles (`student`, `faculty`, `hod`, `admin`), create a centralized escalation engine (`src/lib/escalation.ts`), build reusable approval flow and audit stepper components, and implement dedicated portals for Faculty and Admin while upgrading HOD and Student portals.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS v3, Firebase (Auth & Firestore), Lucide React, Framer Motion, Recharts, Sonner, date-fns.

**Spec:** `docs/superpowers/specs/2026-10-12-multi-tier-faculty-hod-admin-approval-system.md`

## Global Constraints

- Web App Framework: React 18 (Vite) + TypeScript.
- Styling: Tailwind CSS v3 + CSS variables, SIET institutional maroon (`#8B1A1A`) / crimson theme, full dark mode compatibility (`dark:` classes).
- BaaS: Firebase Auth and Firestore with real-time listeners (`onSnapshot`).
- Role Boundaries: Strict role separation across 4 roles (`student`, `faculty`, `hod`, `admin`).
- Domain Restriction: Authentication limited to `@sriniet.edu.in` domain.
- Escalation Matrix: 1-2 days (Faculty decides), 3-5 days (Faculty forwards to HOD, HOD decides), 6+ days (Faculty forwards to HOD, HOD forwards to Admin, Admin decides).

---

### Task 1: Core Domain Types, Escalation Engine, Auth Context & Firestore Security Rules

**Files:**
- Create: `src/types/leave.ts`
- Create: `src/lib/escalation.ts`
- Create: `scripts/test-escalation.mjs`
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `firestore.rules`

**Interfaces:**
- Produces:
  - `UserRole = "student" | "faculty" | "hod" | "admin"`
  - `LeaveStatus = "pending_faculty" | "pending_hod" | "pending_admin" | "approved" | "rejected" | "cancelled"`
  - `ApproverStage = "faculty" | "hod" | "admin" | "completed"`
  - `ApprovalChainEntry` interface
  - `LeaveRequest` interface
  - Escalation helpers: `getFinalAuthority(totalDays)`, `canFacultyApproveDirectly(totalDays)`, `canHodApproveDirectly(totalDays)`, `requiresAdminApproval(totalDays)`
  - Updated `UserData` in `AuthContext` with `assignedYear`, `assignedSection`, `employeeId`, `designation`, `adminLevel`

- [ ] **Step 1: Write the failing test for escalation rules**

Create `scripts/test-escalation.mjs`:

```javascript
import assert from "node:assert/strict";
import { 
  getFinalAuthority, 
  canFacultyApproveDirectly, 
  canHodApproveDirectly, 
  requiresAdminApproval 
} from "../src/lib/escalation.js";

// Test 1: Final authority computation
assert.equal(getFinalAuthority(0.5), "faculty");
assert.equal(getFinalAuthority(1), "faculty");
assert.equal(getFinalAuthority(2), "faculty");
assert.equal(getFinalAuthority(3), "hod");
assert.equal(getFinalAuthority(5), "hod");
assert.equal(getFinalAuthority(6), "admin");
assert.equal(getFinalAuthority(10), "admin");

// Test 2: Faculty authority
assert.equal(canFacultyApproveDirectly(1), true);
assert.equal(canFacultyApproveDirectly(2), true);
assert.equal(canFacultyApproveDirectly(3), false);

// Test 3: HOD authority
assert.equal(canHodApproveDirectly(3), true);
assert.equal(canHodApproveDirectly(5), true);
assert.equal(canHodApproveDirectly(6), false);

// Test 4: Admin authority
assert.equal(requiresAdminApproval(5), false);
assert.equal(requiresAdminApproval(6), true);

console.log("All escalation unit tests passed!");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-escalation.mjs`
Expected: FAIL with "Cannot find module '../src/lib/escalation.js'"

- [ ] **Step 3: Create `src/types/leave.ts` and `src/lib/escalation.ts`**

Create `src/types/leave.ts`:

```typescript
export type UserRole = "student" | "faculty" | "hod" | "admin";

export type LeaveType = "Medical" | "Personal" | "Half-Day" | "Emergency" | "On-Duty";

export type LeaveStatus =
  | "pending_faculty"
  | "pending_hod"
  | "pending_admin"
  | "approved"
  | "rejected"
  | "cancelled";

export type ApproverStage = "faculty" | "hod" | "admin" | "completed";

export interface ApprovalChainEntry {
  stage: "faculty" | "hod" | "admin";
  action: "forwarded" | "approved" | "rejected";
  approverUid: string;
  approverName: string;
  approverRole: UserRole;
  remarks: string;
  timestamp: any;
}

export interface LeaveRequest {
  id: string;
  studentUid: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: number;
  section: string;
  type: LeaveType;
  startDate: any;
  endDate: any;
  totalDays: number;
  reason: string;
  emergencyPhone: string;
  attachmentUrl?: string | null;

  // Multi-tier workflow fields
  status: LeaveStatus;
  currentApprover: ApproverStage;
  finalAuthority: "faculty" | "hod" | "admin";
  approvalChain: ApprovalChainEntry[];

  // Direct remarks for display convenience
  facultyRemarks?: string;
  hodRemarks?: string;
  adminRemarks?: string;

  createdAt: any;
  updatedAt: any;
}

export interface ClassAssignment {
  department: string;
  year: number;
  section: string;
}
```

Create `src/lib/escalation.ts`:

```typescript
import { ApproverStage, LeaveStatus } from "@/types/leave";

export function getFinalAuthority(totalDays: number): "faculty" | "hod" | "admin" {
  if (totalDays <= 2) return "faculty";
  if (totalDays <= 5) return "hod";
  return "admin";
}

export function canFacultyApproveDirectly(totalDays: number): boolean {
  return totalDays <= 2;
}

export function canHodApproveDirectly(totalDays: number): boolean {
  return totalDays <= 5;
}

export function requiresAdminApproval(totalDays: number): boolean {
  return totalDays >= 6;
}

export function getNextPendingStage(currentStage: ApproverStage): {
  nextStage: ApproverStage;
  nextStatus: LeaveStatus;
} {
  if (currentStage === "faculty") {
    return { nextStage: "hod", nextStatus: "pending_hod" };
  }
  if (currentStage === "hod") {
    return { nextStage: "admin", nextStatus: "pending_admin" };
  }
  return { nextStage: "completed", nextStatus: "approved" };
}
```

Create a JS mirror or compile for the test: create `src/lib/escalation.js`:
```javascript
export function getFinalAuthority(totalDays) {
  if (totalDays <= 2) return "faculty";
  if (totalDays <= 5) return "hod";
  return "admin";
}

export function canFacultyApproveDirectly(totalDays) {
  return totalDays <= 2;
}

export function canHodApproveDirectly(totalDays) {
  return totalDays <= 5;
}

export function requiresAdminApproval(totalDays) {
  return totalDays >= 6;
}
```

- [ ] **Step 4: Update `src/contexts/AuthContext.tsx`**

Modify `src/contexts/AuthContext.tsx` to support the 4 roles and extra faculty/admin profile metadata:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export type UserRole = "student" | "faculty" | "hod" | "admin";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  createdAt?: any;
  updatedAt?: any;
  // Student specific
  rollNumber?: string;
  year?: number;
  semester?: number;
  section?: string;
  // Faculty specific
  employeeId?: string;
  assignedYear?: number;
  assignedSection?: string;
  designation?: string;
  // Admin specific
  adminLevel?: "principal" | "dean" | "academic_cell";
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData({ uid: firebaseUser.uid, ...docSnap.data() } as UserData);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
```

- [ ] **Step 5: Update `firestore.rules`**

Modify `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function getUser() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return request.auth != null && getUser().role == "admin";
    }
    
    function isHOD() {
      return request.auth != null && getUser().role == "hod";
    }
    
    function isFaculty() {
      return request.auth != null && getUser().role == "faculty";
    }

    // User profile document rules
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin() || isHOD());
      allow delete: if isAdmin();
    }
    
    // Leave requests rules
    match /leaveRequests/{leaveId} {
      allow read: if request.auth != null && (
        resource.data.studentUid == request.auth.uid ||
        isFaculty() ||
        isHOD() ||
        isAdmin()
      );
      
      allow create: if request.auth != null && request.resource.data.studentUid == request.auth.uid;
      
      allow update: if request.auth != null && (
        (resource.data.studentUid == request.auth.uid && request.resource.data.status == "cancelled") ||
        (isFaculty() && resource.data.status == "pending_faculty") ||
        (isHOD() && (resource.data.status == "pending_hod" || resource.data.department == getUser().department)) ||
        isAdmin()
      );
      
      allow delete: if isAdmin();
    }
    
    // Department Working Days configuration
    match /departmentWorkingDays/{docId} {
      allow read: if request.auth != null;
      allow write: if isHOD() || isAdmin();
    }
  }
}
```

- [ ] **Step 6: Run test and TypeScript compilation**

Run:
```bash
node scripts/test-escalation.mjs
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit changes**

```bash
git add src/types/leave.ts src/lib/escalation.ts src/lib/escalation.js scripts/test-escalation.mjs src/contexts/AuthContext.tsx firestore.rules
git commit -m "feat(core): add multi-tier types, escalation engine, AuthContext updates and security rules"
```

---

### Task 2: Academic Constants & Authentication (Signup & Login)

**Files:**
- Create: `src/lib/constants/academic.ts`
- Modify: `src/pages/auth/Signup.tsx`
- Modify: `src/pages/auth/Login.tsx`

**Interfaces:**
- Consumes: `UserRole`, `UserData` from `src/contexts/AuthContext`.
- Produces: Registration support for `faculty` (with employeeId, department, assignedYear, assignedSection) and role redirects to appropriate dashboards.

- [ ] **Step 1: Create `src/lib/constants/academic.ts`**

Create `src/lib/constants/academic.ts`:

```typescript
export const DEPARTMENTS = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ECE", name: "Electronics & Communication Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
  { code: "ME",  name: "Mechanical Engineering" },
  { code: "CE",  name: "Civil Engineering" },
  { code: "S&H", name: "Science & Humanities" },
] as const;

export const ACADEMIC_YEARS = [1, 2, 3, 4] as const;
export const SECTIONS = ["A", "B", "C", "D"] as const;
export const SEMESTERS = [1, 2] as const;

export const getDepartmentName = (code: string): string => {
  const found = DEPARTMENTS.find((d) => d.code === code);
  return found ? found.name : code;
};
```

- [ ] **Step 2: Update `src/pages/auth/Signup.tsx`**

Modify `src/pages/auth/Signup.tsx` to include `faculty` role option:
- Update schema: `role: z.enum(["student", "faculty", "hod"])`.
- Add validation: if `role === "faculty"`, require `employeeId`, `assignedYear`, and `assignedSection`.
- Add UI fields in the form: When `role === "faculty"` is selected, render inputs for Employee ID, Assigned Year (1–4), and Assigned Section (A–D).
- In `onSubmit`:
```typescript
if (values.role === "faculty") {
  userData.employeeId = values.employeeId?.toUpperCase().trim();
  userData.assignedYear = values.year ? Number(values.year) : 1;
  userData.assignedSection = values.section?.toUpperCase().trim() || "A";
  userData.designation = "Class Advisor";
}
```
- Redirect to `/${values.role}/dashboard`.

- [ ] **Step 3: Update `src/pages/auth/Login.tsx`**

Ensure `src/pages/auth/Login.tsx` navigates dynamically to any of the 4 dashboards:

```typescript
if (userDoc.role === "student") navigate("/student/dashboard");
else if (userDoc.role === "faculty") navigate("/faculty/dashboard");
else if (userDoc.role === "hod") navigate("/hod/dashboard");
else if (userDoc.role === "admin") navigate("/admin/dashboard");
else navigate("/");
```

- [ ] **Step 4: Verify typecheck passes**

Run:
```bash
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/constants/academic.ts src/pages/auth/Signup.tsx src/pages/auth/Login.tsx
git commit -m "feat(auth): enable faculty registration and dynamic 4-role login redirects"
```

---

### Task 3: Visual Audit Stepper & Student Portal Multi-Tier Submission

**Files:**
- Create: `src/components/leave/LeaveAuditStepper.tsx`
- Modify: `src/pages/student/ApplyLeave.tsx`
- Modify: `src/pages/student/MyLeaves.tsx`

**Interfaces:**
- Consumes: `LeaveRequest`, `ApprovalChainEntry` from `src/types/leave.ts`, `getFinalAuthority` from `src/lib/escalation.ts`.
- Produces:
  - `<LeaveAuditStepper leave={leave} />` showing dynamic steps: Faculty Review -> HOD Review (if >= 3 days) -> Admin Review (if >= 6 days) -> Final Result.
  - Leave submission saving `status: "pending_faculty"`, `currentApprover: "faculty"`, and computed `finalAuthority`.

- [ ] **Step 1: Create `src/components/leave/LeaveAuditStepper.tsx`**

Create `src/components/leave/LeaveAuditStepper.tsx`:

```tsx
import React from "react";
import { LeaveRequest } from "@/types/leave";
import { CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface Props {
  leave: LeaveRequest;
}

export const LeaveAuditStepper: React.FC<Props> = ({ leave }) => {
  const { totalDays, status, approvalChain, finalAuthority } = leave;

  // Stages required based on duration
  const stages: Array<{
    key: "faculty" | "hod" | "admin";
    label: string;
    subLabel: string;
  }> = [
    { key: "faculty", label: "Class Advisor", subLabel: "Stage 1 (Faculty)" },
  ];

  if (totalDays >= 3) {
    stages.push({ key: "hod", label: "Head of Dept", subLabel: "Stage 2 (HOD)" });
  }

  if (totalDays >= 6) {
    stages.push({ key: "admin", label: "Principal/Admin", subLabel: "Stage 3 (Admin)" });
  }

  return (
    <div className="py-3 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-zinc-200/50 dark:border-zinc-700/50">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-siet-primary dark:text-red-400" />
          Approval Path ({totalDays} Day{totalDays > 1 ? "s" : ""})
        </span>
        <span className="text-[11px] font-mono uppercase font-bold text-siet-primary dark:text-red-400">
          Deciding Authority: {finalAuthority}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
        {stages.map((stage, idx) => {
          const chainEntry = approvalChain?.find((e) => e.stage === stage.key);
          const isCurrent = leave.currentApprover === stage.key && status.startsWith("pending");
          const isPassed = !!chainEntry && chainEntry.action !== "rejected";
          const isRejected = chainEntry?.action === "rejected";

          return (
            <React.Fragment key={stage.key}>
              <div className="flex items-center gap-2 min-w-fit">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isRejected
                      ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                      : isPassed
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : isCurrent
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 ring-2 ring-amber-400/40 animate-pulse"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {isRejected ? (
                    <XCircle className="h-4 w-4" />
                  ) : isPassed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-foreground">{stage.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {chainEntry
                      ? `${chainEntry.action.toUpperCase()} (${chainEntry.approverName})`
                      : isCurrent
                      ? "Under Review"
                      : "Pending Prior Stage"}
                  </p>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {approvalChain && approvalChain.length > 0 && (
        <div className="pt-2 text-xs space-y-1.5 text-muted-foreground border-t border-zinc-200/50 dark:border-zinc-700/50">
          <p className="font-semibold text-foreground text-[11px]">Audit History:</p>
          {approvalChain.map((entry, i) => (
            <div key={i} className="text-[11px] bg-white dark:bg-zinc-900 p-2 rounded-md border border-zinc-200/60 dark:border-zinc-800 space-y-0.5">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>
                  [{entry.stage.toUpperCase()}] {entry.approverName} ({entry.approverRole})
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                  entry.action === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                  entry.action === "forwarded" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                  "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                }`}>
                  {entry.action}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 italic">"{entry.remarks || "No remarks provided"}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveAuditStepper;
```

- [ ] **Step 2: Update `src/pages/student/ApplyLeave.tsx`**

Modify `src/pages/student/ApplyLeave.tsx` to compute `finalAuthority` using `getFinalAuthority(totalDays)`:
- In `onSubmit`:
```typescript
const finalAuth = getFinalAuthority(totalDays || 1);

await addDoc(collection(db, "leaveRequests"), {
  type: values.type,
  reason: values.reason,
  emergencyPhone: values.emergencyPhone,
  attachmentUrl: values.attachmentUrl || null,
  totalDays: totalDays || 1,
  startDate: Timestamp.fromDate(startObj),
  endDate: Timestamp.fromDate(endObj),
  studentUid: userData.uid,
  studentName: userData.name,
  rollNumber: userData.rollNumber || "N/A",
  department: userData.department,
  year: userData.year || 1,
  section: userData.section || "A",
  status: "pending_faculty",
  currentApprover: "faculty",
  finalAuthority: finalAuth,
  approvalChain: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```
- In UI, render a dynamic guidance box showing the exact approval path:
  - If 1–2 days: "1-2 Days: Decided directly by Class Advisor."
  - If 3–5 days: "3-5 Days: Class Advisor will recommend and forward to HOD."
  - If 6+ days: "6+ Days: Forwarded through Class Advisor → HOD → Principal Approval."

- [ ] **Step 3: Update `src/pages/student/MyLeaves.tsx`**

In `src/pages/student/MyLeaves.tsx`:
- Import `LeaveAuditStepper` from `@/components/leave/LeaveAuditStepper`.
- In the leave card/row expanded view, render `<LeaveAuditStepper leave={leave as any} />`.
- Map status labels cleanly:
  - `"pending_faculty"` -> "Pending Class Advisor"
  - `"pending_hod"` -> "Pending HOD"
  - `"pending_admin"` -> "Pending Principal"
  - `"approved"` -> "Approved"
  - `"rejected"` -> "Rejected"
  - `"cancelled"` -> "Cancelled"

- [ ] **Step 4: Verify typecheck passes**

Run:
```bash
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/leave/LeaveAuditStepper.tsx src/pages/student/ApplyLeave.tsx src/pages/student/MyLeaves.tsx
git commit -m "feat(student): integrate multi-tier submission routing and visual audit stepper"
```

---

### Task 4: Layout & Navigation Integration (Menubar, Masthead & AppRouter)

**Files:**
- Modify: `src/components/layout/Menubar.tsx`
- Modify: `src/components/layout/TopMasthead.tsx`
- Modify: `src/routes/AppRouter.tsx`

**Interfaces:**
- Produces: Navigation and protected routes for all 4 roles:
  - `/faculty/dashboard`, `/faculty/approvals`, `/faculty/history`, `/faculty/profile`
  - `/admin/dashboard`, `/admin/approvals`, `/admin/all-requests`, `/admin/manage-users`, `/admin/profile`
  - `/hod/faculty` (Class Advisor assignment)

- [ ] **Step 1: Update `src/components/layout/Menubar.tsx`**

Modify `src/components/layout/Menubar.tsx`:

```tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePlus2,
  History,
  CheckSquare,
  FileSpreadsheet,
  User,
  Users,
  ShieldAlert,
} from "lucide-react";

interface MenubarItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

interface MenubarProps {
  pendingCount?: number;
}

export const Menubar: React.FC<MenubarProps> = ({ pendingCount }) => {
  const { userData } = useAuth();
  const location = useLocation();

  const studentNavItems: MenubarItem[] = [
    { name: "Overview", path: "/student/dashboard", icon: LayoutDashboard },
    { name: "Apply for Leave", path: "/student/apply", icon: FilePlus2 },
    { name: "My Leave Records", path: "/student/leaves", icon: History },
    { name: "Student Profile", path: "/student/profile", icon: User },
  ];

  const facultyNavItems: MenubarItem[] = [
    { name: "Class Overview", path: "/faculty/dashboard", icon: LayoutDashboard },
    {
      name: "Pending Approvals",
      path: "/faculty/approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
    { name: "Review Archive", path: "/faculty/history", icon: FileSpreadsheet },
    { name: "Faculty Profile", path: "/faculty/profile", icon: User },
  ];

  const hodNavItems: MenubarItem[] = [
    { name: "Department Analytics", path: "/hod/dashboard", icon: LayoutDashboard },
    {
      name: "Pending Approvals",
      path: "/hod/approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
    { name: "Leave Archive", path: "/hod/all-requests", icon: FileSpreadsheet },
    { name: "Faculty Allocation", path: "/hod/faculty", icon: Users },
    { name: "HOD Profile", path: "/hod/profile", icon: User },
  ];

  const adminNavItems: MenubarItem[] = [
    { name: "Institution Overview", path: "/admin/dashboard", icon: LayoutDashboard },
    {
      name: "Executive Approvals",
      path: "/admin/approvals",
      icon: ShieldAlert,
      badge: pendingCount,
    },
    { name: "College Archive", path: "/admin/all-requests", icon: FileSpreadsheet },
    { name: "User Management", path: "/admin/manage-users", icon: Users },
    { name: "Admin Profile", path: "/admin/profile", icon: User },
  ];

  let navItems = studentNavItems;
  if (userData?.role === "faculty") navItems = facultyNavItems;
  else if (userData?.role === "hod") navItems = hodNavItems;
  else if (userData?.role === "admin") navItems = adminNavItems;

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors whitespace-nowrap select-none ${
                  isActive
                    ? "text-siet-primary dark:text-red-400 font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-xl bg-siet-primary/10 dark:bg-red-500/15 border border-siet-primary/25 dark:border-red-500/30 z-0"
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-siet-primary dark:text-red-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-siet-primary dark:bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Menubar;
```

- [ ] **Step 2: Update `src/components/layout/TopMasthead.tsx`**

Modify `src/components/layout/TopMasthead.tsx`:
- Compute `dashboardRoute`:
```typescript
const dashboardRoute = `/${userData?.role || "student"}/dashboard`;
```
- In the profile badge render:
```typescript
<p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
  {userData?.role === "admin"
    ? "Principal / Admin"
    : userData?.role === "hod"
    ? `HOD • ${userData?.department}`
    : userData?.role === "faculty"
    ? `Advisor • ${userData?.department} Y${userData?.assignedYear}-${userData?.assignedSection}`
    : `${userData?.rollNumber || "Student"}`}
</p>
```

- [ ] **Step 3: Update `src/routes/AppRouter.tsx`**

Modify `src/routes/AppRouter.tsx` to support:
- `ProtectedRoute allowedRole?: "student" | "faculty" | "hod" | "admin"`
- Faculty routes:
  - `/faculty/dashboard`
  - `/faculty/approvals`
  - `/faculty/history`
  - `/faculty/profile`
- HOD routes:
  - `/hod/dashboard`
  - `/hod/approvals`
  - `/hod/all-requests`
  - `/hod/faculty`
  - `/hod/profile`
- Admin routes:
  - `/admin/dashboard`
  - `/admin/approvals`
  - `/admin/all-requests`
  - `/admin/manage-users`
  - `/admin/profile`

- [ ] **Step 4: Verify typecheck passes**

Run:
```bash
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/layout/Menubar.tsx src/components/layout/TopMasthead.tsx src/routes/AppRouter.tsx
git commit -m "feat(nav): configure dynamic 4-role navigation tabs and protected router"
```

---

### Task 5: Faculty Portal Implementation

**Files:**
- Create: `src/pages/faculty/FacultyDashboard.tsx`
- Create: `src/pages/faculty/FacultyApprovals.tsx`
- Create: `src/pages/faculty/FacultyHistory.tsx`
- Create: `src/pages/faculty/FacultyProfile.tsx`

**Interfaces:**
- Consumes: `LeaveRequest`, `UserData` from `src/contexts/AuthContext`, `canFacultyApproveDirectly` from `src/lib/escalation.ts`.
- Produces:
  - `FacultyDashboard`: Class statistics (total class leaves, pending class review, forwarded to HOD, approved/rejected).
  - `FacultyApprovals`: Filtered by `department == user.department && year == user.assignedYear && section == user.assignedSection && status == "pending_faculty"`.
    - If `totalDays <= 2`: Actions: **[Approve]** (sets status = "approved") or **[Reject]** (sets status = "rejected").
    - If `totalDays >= 3`: Actions: **[Recommend & Forward to HOD]** (sets status = "pending_hod", currentApprover = "hod") or **[Reject]**.
    - Records action in `approvalChain` array with timestamp and advisor remarks.
  - `FacultyHistory`: Complete table of processed leaves for the class with status filters.
  - `FacultyProfile`: View & edit faculty profile details.

- [ ] **Step 1: Create `src/pages/faculty/FacultyDashboard.tsx`**

Create `src/pages/faculty/FacultyDashboard.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Forward, 
  ArrowRight, 
  AlertCircle 
} from "lucide-react";

export default function FacultyDashboard() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as LeaveRequest[];

      // Filter in-memory for assigned class
      const classLeaves = all.filter(
        (l) => l.year === userData.assignedYear && l.section === userData.assignedSection
      );

      setLeaves(classLeaves);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const pendingLeaves = leaves.filter((l) => l.status === "pending_faculty");
  const forwardedLeaves = leaves.filter((l) => 
    l.approvalChain?.some((e) => e.stage === "faculty" && e.action === "forwarded")
  );
  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected");

  return (
    <DashboardLayout pendingCount={pendingLeaves.length}>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Users className="h-3.5 w-3.5" />
            Class Advisor Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {userData?.department} — Year {userData?.assignedYear || 1} Section {userData?.assignedSection || "A"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official class leave management, direct approvals (1-2 days), and HOD escalation portal.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Forward className="h-3.5 w-3.5 text-blue-500" />
                Forwarded to HOD
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {forwardedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Class Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {approvedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {rejectedLeaves.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Link Card */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">You have {pendingLeaves.length} leave application(s) awaiting review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review requests from your class students and approve 1-2 day leaves or forward longer requests to the Head of Department.
            </p>
          </div>
          <Button asChild className="bg-siet-primary hover:bg-siet-primary-dark text-white font-bold">
            <Link to="/faculty/approvals" className="flex items-center gap-2">
              Go to Pending Queue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Create `src/pages/faculty/FacultyApprovals.tsx`**

Create `src/pages/faculty/FacultyApprovals.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { LeaveRequest, ApprovalChainEntry } from "@/types/leave";
import { canFacultyApproveDirectly } from "@/lib/escalation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Forward, Clock, Paperclip, Phone, ShieldCheck } from "lucide-react";
import LeaveAuditStepper from "@/components/leave/LeaveAuditStepper";
import { format } from "date-fns";

export default function FacultyApprovals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department),
      where("status", "==", "pending_faculty")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as LeaveRequest[];

      const filtered = data.filter(
        (l) => l.year === userData.assignedYear && l.section === userData.assignedSection
      );

      setLeaves(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleAction = async (action: "approved" | "forwarded" | "rejected") => {
    if (!selectedLeave || !userData) return;

    if (action === "rejected" && !remarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const docRef = doc(db, "leaveRequests", selectedLeave.id);

      const chainEntry: ApprovalChainEntry = {
        stage: "faculty",
        action,
        approverUid: userData.uid,
        approverName: userData.name,
        approverRole: "faculty",
        remarks: remarks.trim() || (action === "forwarded" ? "Recommended by Class Advisor" : "Approved by Class Advisor"),
        timestamp: new Date(),
      };

      const updatedChain = [...(selectedLeave.approvalChain || []), chainEntry];

      let nextStatus = selectedLeave.status;
      let nextApprover = selectedLeave.currentApprover;

      if (action === "approved") {
        nextStatus = "approved";
        nextApprover = "completed";
      } else if (action === "forwarded") {
        nextStatus = "pending_hod";
        nextApprover = "hod";
      } else if (action === "rejected") {
        nextStatus = "rejected";
        nextApprover = "completed";
      }

      await updateDoc(docRef, {
        status: nextStatus,
        currentApprover: nextApprover,
        facultyRemarks: remarks.trim() || null,
        approvalChain: updatedChain,
        updatedAt: serverTimestamp(),
      });

      toast.success(
        action === "approved"
          ? "Leave application approved!"
          : action === "forwarded"
          ? "Forwarded to HOD successfully!"
          : "Leave application rejected."
      );

      setSelectedLeave(null);
      setRemarks("");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to process leave request");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout pendingCount={leaves.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Class Advisor Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Reviewing leaves for {userData?.department} Year {userData?.assignedYear} Section {userData?.assignedSection}
          </p>
        </div>

        {leaves.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-bold">No pending leaves for your class</p>
            <p className="text-xs text-muted-foreground mt-1">All applications have been reviewed.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((l) => {
              const canApprove = canFacultyApproveDirectly(l.totalDays);

              return (
                <Card key={l.id} className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base">{l.studentName}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{l.rollNumber}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {l.totalDays} Day{l.totalDays > 1 ? "s" : ""}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    <span className="font-semibold text-foreground">Reason:</span> {l.reason}
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedLeave(l)} 
                      className="text-xs font-semibold flex-1"
                    >
                      View &amp; Action
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal for Action */}
        {selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedLeave.studentName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLeave.rollNumber} • {selectedLeave.type}</p>
                </div>
                <button onClick={() => setSelectedLeave(null)} className="text-zinc-400 hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <LeaveAuditStepper leave={selectedLeave} />

              <div className="text-xs space-y-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <p><span className="font-bold">Duration:</span> {selectedLeave.totalDays} day(s)</p>
                <p><span className="font-bold">Reason:</span> {selectedLeave.reason}</p>
                {selectedLeave.emergencyPhone && (
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedLeave.emergencyPhone}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Advisor Remarks</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or recommendation for HOD..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedLeave(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={isProcessing}
                  onClick={() => handleAction("rejected")}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                {canFacultyApproveDirectly(selectedLeave.totalDays) ? (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleAction("approved")}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve (1-2 Days)
                  </Button>
                ) : (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold" 
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleAction("forwarded")}
                  >
                    <Forward className="h-3.5 w-3.5 mr-1" /> Forward to HOD ({selectedLeave.totalDays} Days)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 3: Create `src/pages/faculty/FacultyHistory.tsx`**

Create `src/pages/faculty/FacultyHistory.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LeaveAuditStepper from "@/components/leave/LeaveAuditStepper";

export default function FacultyHistory() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as LeaveRequest[];

      const filtered = data.filter(
        (l) => l.year === userData.assignedYear && l.section === userData.assignedSection
      );

      setLeaves(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Class Review Archive</h1>
          <p className="text-sm text-muted-foreground">
            Complete history of leave applications processed for Year {userData?.assignedYear} Section {userData?.assignedSection}
          </p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Final Authority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-bold">{l.studentName}</TableCell>
                  <TableCell className="font-mono text-xs">{l.rollNumber}</TableCell>
                  <TableCell>{l.type}</TableCell>
                  <TableCell>{l.totalDays}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800">
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs uppercase font-mono">{l.finalAuthority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 4: Create `src/pages/faculty/FacultyProfile.tsx`**

Create `src/pages/faculty/FacultyProfile.tsx`:

```tsx
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Building, GraduationCap, Shield } from "lucide-react";

export default function FacultyProfile() {
  const { userData } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black">Faculty Advisor Profile</h1>
          <p className="text-sm text-muted-foreground">Class advisory credentials and institutional assignments</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-siet-primary" />
              {userData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>Department: <strong>{userData?.department}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>
                Assigned Class: <strong>Year {userData?.assignedYear || 1} — Section {userData?.assignedSection || "A"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Employee ID: <strong>{userData?.employeeId || "N/A"}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Email: <strong>{userData?.email}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Phone: <strong>{userData?.phone || "N/A"}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 5: Verify typecheck passes**

Run:
```bash
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/pages/faculty/
git commit -m "feat(faculty): implement faculty dashboard, class approvals, history and profile"
```

---

### Task 6: HOD Portal Upgrade (Escalation to Admin & Faculty Management)

**Files:**
- Modify: `src/pages/hod/Approvals.tsx`
- Modify: `src/pages/hod/HodDashboard.tsx`
- Create: `src/pages/hod/FacultyManagement.tsx`

**Interfaces:**
- Consumes: `LeaveRequest`, `UserData` from `src/contexts/AuthContext`, `canHodApproveDirectly` from `src/lib/escalation.ts`.
- Produces:
  - HOD Approvals: Shows leaves with `department == user.department && status == "pending_hod"`.
    - If `totalDays <= 5`: Actions: **[Approve]** (sets status = "approved") or **[Reject]**.
    - If `totalDays >= 6`: Actions: **[Endorse & Forward to Admin]** (sets status = "pending_admin", currentApprover = "admin") or **[Reject]**.
    - Displays prior Faculty Advisor remarks in modal.
  - Faculty Management (`FacultyManagement.tsx`): Allows HOD to list department faculty and assign their Year and Section.

- [ ] **Step 1: Update `src/pages/hod/Approvals.tsx`**

Modify `src/pages/hod/Approvals.tsx`:
- Change Firestore query to fetch `where("department", "==", userData.department)` and `where("status", "==", "pending_hod")`.
- When an approval modal is open:
  - Render `<LeaveAuditStepper leave={selectedLeave} />`.
  - Check `canHodApprove = canHodApproveDirectly(selectedLeave.totalDays)`.
  - If `canHodApprove` is true (3-5 days): Render **Approve (3-5 Days)** button.
  - If `canHodApprove` is false (6+ days): Render **Endorse & Forward to Principal/Admin (6+ Days)** button.
  - On forward to admin: update Firestore doc:
    ```typescript
    await updateDoc(docRef, {
      status: "pending_admin",
      currentApprover: "admin",
      hodRemarks: remarks.trim() || "Endorsed by HOD",
      approvalChain: [...(selectedLeave.approvalChain || []), {
        stage: "hod",
        action: "forwarded",
        approverUid: userData.uid,
        approverName: userData.name,
        approverRole: "hod",
        remarks: remarks.trim() || "Endorsed by HOD for Principal approval",
        timestamp: new Date(),
      }],
      updatedAt: serverTimestamp(),
    });
    ```

- [ ] **Step 2: Update `src/pages/hod/HodDashboard.tsx`**

Modify `src/pages/hod/HodDashboard.tsx` to include cards for:
- "Awaiting HOD Review" (`status === "pending_hod"`)
- "Escalated to Principal/Admin" (`approvalChain` includes HOD forwarded action)

- [ ] **Step 3: Create `src/pages/hod/FacultyManagement.tsx`**

Create `src/pages/hod/FacultyManagement.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserData } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, GraduationCap, Edit2, Check, X } from "lucide-react";

export default function FacultyManagement() {
  const { userData } = useAuth();
  const [facultyList, setFacultyList] = useState<UserData[]>([]);
  const [editingFaculty, setEditingFaculty] = useState<UserData | null>(null);
  const [assignedYear, setAssignedYear] = useState<number>(1);
  const [assignedSection, setAssignedSection] = useState<string>("A");

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "users"),
      where("department", "==", userData.department),
      where("role", "==", "faculty")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      })) as UserData[];
      setFacultyList(data);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleSave = async () => {
    if (!editingFaculty) return;

    try {
      const userRef = doc(db, "users", editingFaculty.uid);
      await updateDoc(userRef, {
        assignedYear,
        assignedSection,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Assigned ${editingFaculty.name} to Year ${assignedYear} Sec ${assignedSection}`);
      setEditingFaculty(null);
    } catch {
      toast.error("Failed to update class assignment");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Faculty Class Advisory Allocation</h1>
          <p className="text-sm text-muted-foreground">
            Assign {userData?.department} faculty members as Class Advisors for specific Years and Sections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyList.map((f) => (
            <Card key={f.uid} className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base">{f.name}</h3>
                  <p className="text-xs text-muted-foreground">{f.email}</p>
                  <p className="text-xs font-mono text-zinc-500">ID: {f.employeeId || "N/A"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingFaculty(f);
                    setAssignedYear(f.assignedYear || 1);
                    setAssignedSection(f.assignedSection || "A");
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs space-y-1">
                <p className="font-bold text-foreground">Current Assignment:</p>
                <p className="text-muted-foreground">
                  Year {f.assignedYear || "Not Set"} — Section {f.assignedSection || "Not Set"}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal for Edit */}
        {editingFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-lg">Assign Class Advisor</h3>
              <p className="text-xs text-muted-foreground">{editingFaculty.name}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Academic Year</label>
                  <Select value={String(assignedYear)} onValueChange={(v) => setAssignedYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Section</label>
                  <Select value={assignedSection} onValueChange={setAssignedSection}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                      <SelectItem value="C">Section C</SelectItem>
                      <SelectItem value="D">Section D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingFaculty(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} className="bg-siet-primary hover:bg-siet-primary-dark text-white font-bold">
                  Save Assignment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 4: Verify typecheck passes**

Run:
```bash
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/pages/hod/Approvals.tsx src/pages/hod/HodDashboard.tsx src/pages/hod/FacultyManagement.tsx
git commit -m "feat(hod): upgrade HOD portal with admin escalation and faculty management"
```

---

### Task 7: Central Admin Portal Implementation

**Files:**
- Create: `src/pages/admin/AdminDashboard.tsx`
- Create: `src/pages/admin/AdminApprovals.tsx`
- Create: `src/pages/admin/AdminAllRequests.tsx`
- Create: `src/pages/admin/AdminManageUsers.tsx`
- Create: `src/pages/admin/AdminProfile.tsx`

**Interfaces:**
- Consumes: `LeaveRequest`, `UserData` from `src/contexts/AuthContext`.
- Produces:
  - `AdminDashboard`: Cross-department charts (CSE, ECE, EEE, ME, CE, S&H), total college leave volume, long-leave alerts.
  - `AdminApprovals`: List of leaves where `status == "pending_admin"`. Complete audit trail visible (Faculty + HOD remarks). Actions: **[Grant Institutional Approval]** or **[Reject]**.
  - `AdminAllRequests`: Master table of all institution leaves with department filters, date filters, and CSV export.
  - `AdminManageUsers`: Administrative user management console to promote/demote roles (`student`, `faculty`, `hod`, `admin`) and edit assignments.
  - `AdminProfile`: Administrator profile management.

- [ ] **Step 1: Create `src/pages/admin/AdminDashboard.tsx`**

Create `src/pages/admin/AdminDashboard.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldAlert, Users, CheckCircle2, Clock } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants/academic";

const COLORS = ["#8B1A1A", "#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777"];

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as LeaveRequest[];
      setLeaves(data);
    });

    return () => unsubscribe();
  }, []);

  const pendingAdminLeaves = leaves.filter((l) => l.status === "pending_admin");
  const approvedLeaves = leaves.filter((l) => l.status === "approved");

  // Dept distribution
  const deptData = DEPARTMENTS.map((dept) => ({
    name: dept.code,
    count: leaves.filter((l) => l.department === dept.code).length,
  }));

  return (
    <DashboardLayout pendingCount={pendingAdminLeaves.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Central Administration Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Srinivasa Institute of Engineering &amp; Technology — Institutional Leave Control &amp; Analytics
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                Pending Principal Clearance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {pendingAdminLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Total Approved Leaves
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {approvedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                Total College Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {leaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                Departments Monitored
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {DEPARTMENTS.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-sm mb-4">Department-wise Leave Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B1A1A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-sm mb-4">Leave Types Ratio</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Medical", value: leaves.filter(l => l.type === "Medical").length },
                      { name: "Personal", value: leaves.filter(l => l.type === "Personal").length },
                      { name: "Half-Day", value: leaves.filter(l => l.type === "Half-Day").length },
                      { name: "Emergency", value: leaves.filter(l => l.type === "Emergency").length },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Create `src/pages/admin/AdminApprovals.tsx`**

Create `src/pages/admin/AdminApprovals.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { LeaveRequest, ApprovalChainEntry } from "@/types/leave";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, ShieldAlert, Phone } from "lucide-react";
import LeaveAuditStepper from "@/components/leave/LeaveAuditStepper";

export default function AdminApprovals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "leaveRequests"),
      where("status", "==", "pending_admin")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as LeaveRequest[];
      setLeaves(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (action: "approved" | "rejected") => {
    if (!selectedLeave || !userData) return;

    setIsProcessing(true);
    try {
      const docRef = doc(db, "leaveRequests", selectedLeave.id);

      const chainEntry: ApprovalChainEntry = {
        stage: "admin",
        action,
        approverUid: userData.uid,
        approverName: userData.name,
        approverRole: "admin",
        remarks: remarks.trim() || (action === "approved" ? "Institutional Clearance Granted" : "Rejected by Principal"),
        timestamp: new Date(),
      };

      await updateDoc(docRef, {
        status: action === "approved" ? "approved" : "rejected",
        currentApprover: "completed",
        adminRemarks: remarks.trim() || null,
        approvalChain: [...(selectedLeave.approvalChain || []), chainEntry],
        updatedAt: serverTimestamp(),
      });

      toast.success(action === "approved" ? "Institutional leave approved!" : "Leave application rejected.");
      setSelectedLeave(null);
      setRemarks("");
    } catch {
      toast.error("Failed to process executive action");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout pendingCount={leaves.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Principal / Executive Clearance Queue</h1>
          <p className="text-sm text-muted-foreground">
            Extended student leaves (6+ days) requiring institutional clearance
          </p>
        </div>

        {leaves.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-bold">No executive leaves awaiting clearance</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((l) => (
              <Card key={l.id} className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">{l.studentName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {l.rollNumber} • {l.department} Y{l.year}-{l.section}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {l.totalDays} Days
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                  <span className="font-semibold text-foreground">Reason:</span> {l.reason}
                </p>

                <Button size="sm" variant="outline" onClick={() => setSelectedLeave(l)} className="w-full text-xs font-semibold">
                  Review Audit Trail &amp; Decide
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedLeave.studentName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedLeave.department} • {selectedLeave.totalDays} Days</p>
                </div>
                <button onClick={() => setSelectedLeave(null)}><X className="h-5 w-5" /></button>
              </div>

              <LeaveAuditStepper leave={selectedLeave} />

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Executive Remarks</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter institutional approval or rejection remarks..."
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLeave(null)}>Cancel</Button>
                <Button variant="destructive" size="sm" disabled={isProcessing} onClick={() => handleAction("rejected")}>
                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" size="sm" disabled={isProcessing} onClick={() => handleAction("approved")}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Grant Approval
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 3: Create `src/pages/admin/AdminAllRequests.tsx`**

Create `src/pages/admin/AdminAllRequests.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants/academic";

export default function AdminAllRequests() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedDept, setSelectedDept] = useState("ALL");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as LeaveRequest[];
      setLeaves(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredLeaves = selectedDept === "ALL" ? leaves : leaves.filter((l) => l.department === selectedDept);

  const exportCSV = () => {
    const headers = "Student,RollNumber,Dept,Year,Section,Type,TotalDays,Status,FinalAuthority\n";
    const rows = filteredLeaves
      .map((l) => `"${l.studentName}","${l.rollNumber}","${l.department}","${l.year}","${l.section}","${l.type}","${l.totalDays}","${l.status}","${l.finalAuthority}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siet-leaves-${selectedDept}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">College-wide Leave Master Archive</h1>
            <p className="text-sm text-muted-foreground">Comprehensive search across all academic branches</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={exportCSV} className="gap-2 font-bold">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Authority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-bold">{l.studentName}</TableCell>
                  <TableCell className="font-mono text-xs">{l.rollNumber}</TableCell>
                  <TableCell>{l.department}</TableCell>
                  <TableCell>Y{l.year}-{l.section}</TableCell>
                  <TableCell>{l.totalDays}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800">
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono uppercase">{l.finalAuthority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 4: Create `src/pages/admin/AdminManageUsers.tsx`**

Create `src/pages/admin/AdminManageUsers.tsx`:

```tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserData, UserRole } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Edit2, Shield } from "lucide-react";

export default function AdminManageUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      })) as UserData[];
      setUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        role: selectedRole,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Updated ${selectedUser.name}'s role to ${selectedRole}`);
      setSelectedUser(null);
    } catch {
      toast.error("Failed to update user role");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Institution User Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Promote or manage permissions for Students, Faculty Advisors, HODs, and Administrators
          </p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell className="font-bold">{u.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.department || "N/A"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      u.role === "admin" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                      u.role === "hod" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                      u.role === "faculty" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(u);
                        setSelectedRole(u.role);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-lg">Modify User Role</h3>
              <p className="text-xs text-muted-foreground">{selectedUser.name} ({selectedUser.email})</p>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Select Role</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty (Class Advisor)</SelectItem>
                    <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                    <SelectItem value="admin">Administrator (Principal/Dean)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Cancel</Button>
                <Button size="sm" onClick={handleRoleChange} className="bg-siet-primary text-white font-bold">
                  Update Role
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 5: Create `src/pages/admin/AdminProfile.tsx`**

Create `src/pages/admin/AdminProfile.tsx`:

```tsx
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Phone, Building } from "lucide-react";

export default function AdminProfile() {
  const { userData } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black">Principal / Administrative Profile</h1>
          <p className="text-sm text-muted-foreground">Executive administration credentials and permissions</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-siet-primary" />
              {userData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>Jurisdiction: <strong>Campus-Wide (All Departments)</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Role: <strong>Principal / Central Administrator</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Email: <strong>{userData?.email}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Emergency Office Contact: <strong>{userData?.phone || "N/A"}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 6: Verify typecheck passes**

Run:
```bash
npx tsc -b
```
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit changes**

```bash
git add src/pages/admin/
git commit -m "feat(admin): implement complete central admin portal and user management console"
```

---

### Task 8: End-to-End System Verification & Production Build Validation

**Files:**
- Verify: Full codebase compilation and bundle build.

- [ ] **Step 1: Execute full TypeScript compilation check**

Run:
```bash
npx tsc -b
```
Expected: 0 errors.

- [ ] **Step 2: Execute Vite production build**

Run:
```bash
npm run build
```
Expected: Clean build in `dist/` with zero runtime or packaging errors.

- [ ] **Step 3: Test role separation and routing**

Ensure all paths (`/student/*`, `/faculty/*`, `/hod/*`, `/admin/*`) are covered by ProtectedRoute and fallback redirect handles unauthorized roles cleanly.

- [ ] **Step 4: Final Git Commit**

```bash
git add .
git commit -m "chore(release): complete multi-tier faculty-hod-admin leave approval system"
```
