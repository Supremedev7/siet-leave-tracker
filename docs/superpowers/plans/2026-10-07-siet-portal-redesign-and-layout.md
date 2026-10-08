# SIET Leave Tracker — Industrial Academic Portal & Dual-Logo Interface Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the SIET Leave Tracker into a world-class, institutional-grade academic portal that strictly eliminates generic "AI slop" (candy-badge pills, ping animations, emoji greetings), seamlessly integrates both official SIET logos (`siet-logo-full.png` and `siet-emblem.png`), and deploys fluid Framer Motion spring animations with a dual-tier academic menubar/masthead architecture.

**Architecture:** Implement an enterprise dual-tier portal framework (`PortalLayout`) combining an institutional academic masthead (`TopMasthead`) and a sticky command menubar (`Menubar`) with fluid spring-sliding active tab indicators (`layoutId="activeTabPill"`). Replace full-screen loading spinners with an indeterminate top accent progress bar. Replace AI-slop badges with typographic status tags (`StatusTag`). Embed both official logos purposefully: the horizontal banner for institutional mastheads and letterheads; the circular emblem seal for academic credentials, stamps, favicons, and holographic verifications.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Firebase Auth/Firestore, date-fns, Recharts, sonner.

**Spec:** [docs/superpowers/specs/2026-10-06-siet-leave-tracker-design.md](file:///home/supreme/Documents/Project/Web/SIET/docs/superpowers/specs/2026-10-06-siet-leave-tracker-design.md)

---

## Global Constraints

- **Brand Palette:** Deep SIET Maroon (`#8B1A1A`), Rich Burgundy (`#6B1414`), Amber Gold (`#F7941D`), Dark Amber (`#E07B0A`), Slate (`#0F172A`), Off-White Paper Canvas (`#FAFAF9`), Pure White (`#FFFFFF`).
- **Dual Official Logos Only:** Zero AI-generated or custom vector badges. Only use:
  - `src/assets/siet-logo-full.png` (Horizontal Full Lockup)
  - `src/assets/siet-emblem.png` (Circular Seal Crest)
- **Zero AI-Slop Directives:**
  - No `animate-ping` pulsing dots on static badges.
  - No cartoonish emojis (e.g., `👋`, `🎉`, `✨`).
  - No pastel candy badge pills (`bg-green-100 text-green-700 rounded-full px-4`).
  - No spinning full-screen ball loaders.
  - No oversized blurry opacity watermarks.
- **Strict TypeScript & Build Standards:** Zero compiler warnings or errors under `noUnusedLocals: true` (`npx tsc -b`).

---

## File Structure

```
src/
├── assets/
│   ├── siet-logo-full.png          [EXISTING] - Full horizontal institutional lockup
│   └── siet-emblem.png             [EXISTING] - Circular temple crest emblem
├── components/
│   ├── branding/
│   │   └── SIETLogo.tsx            [EXISTING] - Dual logo component supporting 'full' & 'emblem'
│   ├── layout/
│   │   ├── TopMasthead.tsx         [EXISTING] - Institutional top bar with dual logo & profile menu
│   │   ├── Menubar.tsx             [EXISTING] - Sticky menubar with Framer Motion sliding pill
│   │   ├── PortalLayout.tsx        [EXISTING] - Master dual-tier wrapper for all authenticated views
│   │   └── DashboardLayout.tsx     [EXISTING] - Backward-compatible re-export of PortalLayout
│   ├── ui/
│   │   ├── StatusTag.tsx           [EXISTING] - Clean 1px-border typographic status tag
│   │   ├── StatusBadge.tsx         [EXISTING] - Re-exports StatusTag for 100% backward compatibility
│   │   ├── MinimalLoader.tsx       [EXISTING] - Top linear indeterminate progress bar & minimal crest splash
│   │   ├── LoadingScreen.tsx       [EXISTING] - Re-exports MinimalLoader for route suspense
│   │   ├── PageTransition.tsx      [EXISTING] - Framer Motion spring route wrapper
│   │   └── StatsCard.tsx           [MODIFY] - Clean academic metrics card with spring hover lift
│   └── student/
│       └── LeaveCertificate.tsx    [MODIFY] - Official Gate Pass featuring both logos (letterhead + stamp)
├── pages/
│   ├── auth/
│   │   ├── Login.tsx               [MODIFY] - Academic portal login featuring both logos & clean typography
│   │   └── Signup.tsx              [MODIFY] - Academic registration with student/faculty verification
│   ├── student/
│   │   ├── StudentDashboard.tsx    [MODIFY] - Academic overview with StatusTag & spring micro-animations
│   │   ├── ApplyLeave.tsx          [MODIFY] - Streamlined institutional leave application form
│   │   ├── MyLeaves.tsx            [MODIFY] - High-density leave history ledger & certificate launcher
│   │   └── Profile.tsx             [MODIFY] - Digital Student ID card with both logos & contact editor
│   └── hod/
│       ├── HodDashboard.tsx        [MODIFY] - Executive department analytics & live pending approvals
│       ├── Approvals.tsx           [MODIFY] - High-efficiency approval queue with instant action modal
│       ├── AllRequests.tsx         [MODIFY] - Department leave archive with multi-column filtering
│       └── Profile.tsx             [MODIFY] - Faculty Department Head accreditation card with seal
```

---

## Task Decomposition

### Task 1: Dual-Logo Identity Architecture & System Integration

**Files:**
- Modify: `src/components/branding/SIETLogo.tsx`
- Modify: `src/components/layout/TopMasthead.tsx`
- Test: Build verification with `npx tsc -b`

**Interfaces:**
- Produces: `SIETLogo` component supporting `variant="full" | "emblem" | "icon"`.
- Produces: `sietFullLogo` and `sietEmblem` image path exports.
- Consumes: `src/assets/siet-logo-full.png` and `src/assets/siet-emblem.png`.

- [ ] **Step 1: Verify `SIETLogo.tsx` supports both variants with clean fallback and accessible alt text**
- [ ] **Step 2: Ensure `TopMasthead.tsx` seamlessly integrates the full logo on the left and the round emblem crest in the user profile capsule**
- [ ] **Step 3: Run `npx tsc -b` to verify zero TypeScript errors**

---

### Task 2: Elimination of AI Slop Badges & StatusTag Standard

**Files:**
- Modify: `src/components/ui/StatusTag.tsx`
- Modify: `src/components/ui/StatusBadge.tsx`

**Interfaces:**
- Produces: `<StatusTag status="pending" | "approved" | "rejected" | "cancelled" size="sm" | "md" />`
- Styling contract:
  - `Approved`: `border-emerald-200/80 bg-emerald-50/60 text-emerald-800` + solid 5px emerald dot (`bg-emerald-600`)
  - `Pending`: `border-amber-200/80 bg-amber-50/60 text-amber-800` + solid 5px amber dot (`bg-amber-600`)
  - `Rejected`: `border-rose-200/80 bg-rose-50/60 text-rose-800` + solid 5px rose dot (`bg-rose-600`)
  - `Cancelled`: `border-zinc-200 bg-zinc-50 text-zinc-600` + solid 5px neutral dot (`bg-zinc-400`)
  - Absolute elimination of `animate-ping` pulsing loops.

- [ ] **Step 1: Check `StatusTag.tsx` implementation for clean micro-dot typography**
- [ ] **Step 2: Confirm `StatusBadge.tsx` safely re-exports `StatusTag` for complete backward compatibility**
- [ ] **Step 3: Run `npx tsc -b`**

---

### Task 3: Minimalist Top Progress Loader & Screen

**Files:**
- Modify: `src/components/ui/MinimalLoader.tsx`
- Modify: `src/components/ui/LoadingScreen.tsx`

**Interfaces:**
- Produces: `MinimalTopProgressBar`: Top fixed indeterminate progress bar (`h-1 bg-gradient-to-r from-siet-primary via-siet-gold to-siet-primary`).
- Produces: `MinimalSplashLoader`: Dignified institutional cold-start screen displaying the official circular emblem crest with subtle opacity pulse and institutional title.
- Replaces: Any cartoonish spinning circles or full-screen loading blockers.

- [ ] **Step 1: Confirm `MinimalLoader.tsx` provides high-performance Framer Motion linear progress**
- [ ] **Step 2: Confirm `LoadingScreen.tsx` serves `MinimalSplashLoader` cleanly**
- [ ] **Step 3: Run `npx tsc -b`**

---

### Task 4: Premium Dual-Tier Academic Portal Shell & Menubar

**Files:**
- Modify: `src/components/layout/TopMasthead.tsx`
- Modify: `src/components/layout/Menubar.tsx`
- Modify: `src/components/layout/PortalLayout.tsx`
- Modify: `src/components/layout/DashboardLayout.tsx`

**Interfaces:**
- Tier 1 (`TopMasthead`): Height 72px–80px.
  - Left: Full SIET horizontal logo (`siet-logo-full.png`) + mobile crest fallback (`siet-emblem.png`).
  - Center: Academic session badge (`AY 2025–26 • Sem I • Autonomous • NAAC 'A' Grade`).
  - Right: Circular emblem avatar chip + user credentials dropdown + Sign Out button.
- Tier 2 (`Menubar`): Sticky top navigation with Framer Motion `layoutId="activeTabPill"` spring sliding indicator.
  - Student tabs: Overview, Apply for Leave, My Leave Records, Student Profile.
  - HOD tabs: Department Analytics, Pending Approvals (with integer count tag), All Student Records, Faculty Profile.
- Shell (`PortalLayout`): Provides unified maximum 1360px grid workspace with consistent padding and zero sidebar clutter.

- [ ] **Step 1: Verify `Menubar.tsx` active indicator spring physics (`stiffness: 450, damping: 35`)**
- [ ] **Step 2: Confirm `PortalLayout.tsx` wraps all children with responsive padding and sticky layout**
- [ ] **Step 3: Run `npx tsc -b`**

---

### Task 5: Page Transitions & Spring Micro-Animations

**Files:**
- Modify: `src/components/ui/PageTransition.tsx`
- Modify: `src/components/ui/StatsCard.tsx`
- Modify: `src/routes/AppRouter.tsx`

**Interfaces:**
- Produces: `<PageTransition>` wrapper around every route in `AppRouter.tsx` using `motion.div`:
  - `initial={{ opacity: 0, y: 8 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `exit={{ opacity: 0, y: -4 }}`
  - `transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}`
- Produces: `<StatsCard>` with Framer Motion spring hover lift (`whileHover={{ y: -2 }}`) and clean institutional borders.

- [ ] **Step 1: Verify `PageTransition.tsx` animation parameters**
- [ ] **Step 2: Update `StatsCard.tsx` with refined typography and subtle hover elevation**
- [ ] **Step 3: Ensure `AppRouter.tsx` wraps student and HOD views with `<PageTransition>`**
- [ ] **Step 4: Run `npx tsc -b`**

---

### Task 6: Modernize Auth Views (Login & Signup)

**Files:**
- Modify: `src/pages/auth/Login.tsx`
- Modify: `src/pages/auth/Signup.tsx`

**Refinements:**
- Embed both logos:
  - Top institutional letterhead: `siet-logo-full.png`.
  - Academic credential seal: `siet-emblem.png` alongside the card title.
- Remove all cartoon emojis (e.g. `👋`) and AI-slop icons (`Sparkles`).
- Clean, high-contrast academic portal design with official `@sriniet.edu.in` domain guidance.
- Clean role switcher (Student Portal vs Faculty/HOD Portal) with instant feedback.

- [ ] **Step 1: Refactor `src/pages/auth/Login.tsx` with dual logo integration and no emojis**
- [ ] **Step 2: Refactor `src/pages/auth/Signup.tsx` with clean academic verification tabs and both logos**
- [ ] **Step 3: Run `npx tsc -b`**

---

### Task 7: Student Portal Re-architecting

**Files:**
- Modify: `src/pages/student/StudentDashboard.tsx`
- Modify: `src/pages/student/ApplyLeave.tsx`
- Modify: `src/pages/student/MyLeaves.tsx`
- Modify: `src/pages/student/Profile.tsx`
- Modify: `src/components/student/LeaveCertificate.tsx`

**Refinements:**
- `StudentDashboard.tsx`: Replace legacy `STATUS_CONFIG` with `StatusTag`. Display quota balance cards, quick application CTA, and recent requests table.
- `ApplyLeave.tsx`: Clean multi-step or unified institutional leave application form with live day counter and clear date validation.
- `MyLeaves.tsx`: High-density academic leave ledger with status tags, search filter, and printable pass button.
- `LeaveCertificate.tsx`: Dual-logo printable gate pass:
  - Top header: `siet-logo-full.png` (official institutional letterhead).
  - Bottom verification seal: `siet-emblem.png` framed in an emerald digital authorization stamp with date-time hash.
- `Profile.tsx`: Official Digital Student Identity Card featuring `siet-logo-full.png` at top and `siet-emblem.png` as circular holographic crest, with profile contact editor.

- [ ] **Step 1: Refactor `StudentDashboard.tsx` to adopt `StatusTag` and clean stats cards**
- [ ] **Step 2: Refactor `ApplyLeave.tsx` with streamlined validation and academic styling**
- [ ] **Step 3: Refactor `MyLeaves.tsx` with high-density data table and certificate trigger**
- [ ] **Step 4: Update `LeaveCertificate.tsx` with dual-logo official gate pass styling**
- [ ] **Step 5: Refactor `Profile.tsx` with official Student ID card incorporating both logos**
- [ ] **Step 6: Run `npx tsc -b`**

---

### Task 8: HOD Administrative & Analytics Portal

**Files:**
- Modify: `src/pages/hod/HodDashboard.tsx`
- Modify: `src/pages/hod/Approvals.tsx`
- Modify: `src/pages/hod/AllRequests.tsx`
- Modify: `src/pages/hod/Profile.tsx`

**Refinements:**
- `HodDashboard.tsx`: Executive department analytics using SIET Crimson and Amber tokens in Recharts, real-time pending counters, and quick approval shortcut actions.
- `Approvals.tsx`: High-efficiency approval queue with instant action modal (Approve / Reject with mandatory remarks) and `StatusTag`.
- `AllRequests.tsx`: Department-wide leave archive with search, filter by department/year/status, and clean CSV export.
- `Profile.tsx`: Faculty Department Head accreditation card with both official logos and credential verification.

- [ ] **Step 1: Refactor `HodDashboard.tsx` to use clean charts and unified layout**
- [ ] **Step 2: Refactor `Approvals.tsx` with instant approval modal and clean `StatusTag`**
- [ ] **Step 3: Refactor `AllRequests.tsx` with CSV export and multi-parameter filtering**
- [ ] **Step 4: Refactor `Profile.tsx` for HOD with faculty accreditation badge**
- [ ] **Step 5: Run `npx tsc -b`**

---

### Task 9: Comprehensive Automated & Visual Verification

**Files:**
- Verification only

- [ ] **Step 1: Execute `npx tsc -b` to guarantee zero compilation errors**
- [ ] **Step 2: Execute `npm run build` to confirm production Vite bundle succeeds**
- [ ] **Step 3: Use Playwright browser verification to inspect the rendered portal, menubar animations, dual logo alignment, and clean typography**

---

## Verification Plan

### Automated Checks
```bash
# 1. Strict TypeScript validation
cd /home/supreme/Documents/Project/Web/SIET && npx tsc -b

# 2. Production build verification
npm run build
```

### Manual & Visual Verification
1. **Dual-Logo Display**:
   - Check TopMasthead: `siet-logo-full.png` visible on desktop, `siet-emblem.png` visible in profile capsule and mobile masthead.
   - Check Login/Signup: Both logos visible in header and card credential crest.
   - Check Student ID Card & Leave Certificate: Full lockup at top, round emblem seal as official verified stamp.
2. **Best Animations**:
   - Menubar tabs glide smoothly with spring physics when clicking between routes.
   - Routes transition smoothly with vertical drift and fade.
   - Modals enter with spring scale physics.
3. **Zero AI Slop**:
   - No pulsating ping dots anywhere.
   - No emoji greetings.
   - No pastel candy badges; only crisp typographic status tags with 1px borders and solid micro-dots.
