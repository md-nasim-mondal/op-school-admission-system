# PHASE 4: STUDENT IDENTITY & UX AUDIT REPORT
## School Admission System — Onnorokom Projukti Limited

**Audit Date:** 2026-11-11  
**Auditor Roles:** Senior Product Designer, UX Engineer, React/TypeScript Architect, .NET Backend Engineer, QA Engineer, Assignment Compliance Reviewer  
**Status:** Audit Completed — Implementation Plan Defined  

---

## 1. Executive Summary

The School Admission System backend, concurrency architecture, PostgreSQL transactional row/advisory locking, Docker orchestration, and automated test suites have achieved 100% pass rates across previous audits. However, an end-to-end user experience and product evaluation of the live frontend identified a critical UX divergence from real-world student usability:

1. **Premature Demo Identity Assumption:** The frontend currently initializes the student identity to a hardcoded demo BRN (`20152691234567890`) upon first launch if `localStorage` is empty.
2. **Missing Identification Landing Screen:** A new student or parent visiting the portal is not greeted with a clean, welcoming Student Identification Screen to declare their 17-digit Birth Registration Number (BRN) before accessing admission records.
3. **No Student Switching / Identity Reset Workflow:** There is no dedicated `Switch Student` / `Change Student ID` action. Switching identity currently requires manually editing the header input, which fails to clear previous query caches or provide a clean handoff between students.
4. **Header Visual Clutter:** A 17-digit input field permanently occupies primary navbar real estate across desktop and mobile, resembling a conventional session without providing clear identity boundaries.
5. **Generic Class Action Messaging:** All class action buttons display a generic `Already Applied` text whenever any hold or confirmation exists, failing to distinguish between active holds on the current class, holds on another class, confirmed admissions, or expired/cancelled holds where the student is eligible to `Apply Again`.

---

## 2. Requirement Traceability: Explicit Requirements vs. Current Implementation

| Area | Assignment Specification | Current Implementation | Audit Finding & Gap |
|---|---|---|---|
| **Authentication & Identity** | *"Login লাগবে না। Page-এর উপরে একটা ঘরে শিক্ষার্থীর জন্ম নিবন্ধন নম্বর লেখা যাবে। UI এটাকেই শিক্ষার্থীর পরিচয় হিসেবে ধরে নেবে। API-তে শিক্ষার্থী র পরিচয় আসবে X-Student-Id header দিয়ে।"* | Input field in `Navbar.tsx` binds to `StudentContext.tsx` which defaults to hardcoded demo BRN `20152691234567890`. | **Gap:** Initializing with a hardcoded ID mimics a pre-logged-in session. When no student is identified, there should be an identification screen. |
| **Student Switching** | Multiple applicants/parents must be able to use the system on the same machine/browser. | No `Switch Student` button. Manual text editing does not flush TanStack Query cache. | **Gap:** Lack of an explicit `Switch Student` workflow risks displaying cached data of the previous student to a new applicant. |
| **API Header Injection** | Headers: `X-Student-Id` sent with student operations (`/classes/{id}/holds`, `/holds/{id}/confirm`, `/holds/{id}`, `/me/holds`). | Axios request interceptor injects `X-Student-Id` from `localStorage` or explicit call arguments. | **Pass / Compliant:** Backend strictly validates 17-digit format (`StudentIdValidator`) and enforces ownership (`403 Forbidden`). |
| **Button States & Feedback** | Student cannot apply if they hold an active seat; UI must be clear and responsive. | Buttons disabled with generic `Already Applied` if `hasActiveHoldOrConfirmed` is true. | **Gap:** Misleading button labels. Does not inform user if admission is confirmed, held on another class, or if they can re-apply after expiry. |
| **Admin Portal** | *"School admin আর অভিভাবক সব কাজ UI থেকেই করবেন।"* School admin creates classes/shifts, sets seat capacities, monitors seats. | Dedicated `/admin` route with capacity summary cards, class creation modal, and real-time polling table. | **Compliant:** Meets requirements; can be enhanced with search/filtering and clear demo-mode labeling. |

---

## 3. Categorization of Features

### A. Mandatory Requirements (Must be strictly satisfied)
1. **No Conventional Auth:** Do NOT implement passwords, JWTs, OTPs, session cookies, or user registration.
2. **17-Digit BRN Support:** Preserve string format and leading zeros in frontend and backend.
3. **`X-Student-Id` Header:** Accurately pass the header on all student endpoints (`POST /classes/{id}/holds`, `POST /holds/{id}/confirm`, `DELETE /holds/{id}`, `GET /me/holds`).
4. **Student Identification Screen:** When no valid student ID is active, present a clear identification view explaining that the 17-digit BRN is used to identify the student for application tracking (with a quick "Use Demo ID" shortcut for reviewers).
5. **Clear Application Ownership & Cache Isolation:** Switching students must completely clear client-side state and TanStack Query cache for `['myHolds', studentId]`. Previous student data must never be visible to the new student.
6. **Backend Source of Truth:** Switching students on the browser must NEVER delete, expire, or cancel database records or holds belonging to the previous student.
7. **Accurate State-Aware Class Action Buttons:**
   - `Apply for Admission` (No active hold or confirmed admission)
   - `Continue Application` (Student holds an active reservation in this class)
   - `Application Already Active` (Student holds an active reservation in another class)
   - `Admission Confirmed` (Student is confirmed in this class)
   - `Already Admitted to Another Class` (Student is confirmed in another class)
   - `No Seats Available` (Class is full: `availableSeats === 0`)
   - `Apply Again` (Previous hold expired or cancelled, student is now eligible)

### B. Reasonable UX Enhancements (Recommended)
1. **Compact Identity Badge in Navbar:** When identified, replace the bulky text input in the navbar with a clean, compact student badge (`BRN: 20152691234567890`) and a prominent `Switch Student` button.
2. **Switch Confirmation Modal/Dialog:** Prompt the user with a confirmation modal before clearing local session state, explaining that their application remains safe on the server.
3. **Real-Time Search & Shift Filter on Admin Portal:** Allow admin to filter classes by name (e.g., "Morning Shift", "Day Shift", "Class 6") and sort by occupancy.
4. **Quick Identity Presets for Testing:** Provide test BRN presets (e.g., `Student A`, `Student B`) on the identification screen so reviewers can test multi-student scenarios in one click.

### C. Optional Bonuses
1. Visual occupancy progress bars.
2. Toast notification system for feedback (already implemented).
3. Live seat polling every 5 seconds (already implemented).

---

## 4. Backend & API Impact Assessment

- **Are backend or database changes required?**
  **NO.** The backend already strictly implements all 8 REST endpoints, pessimistic row locking (`SELECT ... FOR UPDATE`), transaction advisory locking (`SELECT pg_advisory_xact_lock`), and header-based student isolation.
- **API Contract Verification:**
  The backend expects `X-Student-Id: <17-digits>` as a request header. When a student switches on the frontend, the client simply clears its local state and attaches the new student's ID on subsequent requests. The backend will return `/me/holds` isolated strictly to the new ID.
- **Zero Breaking Changes:** Existing 32 backend tests will remain 100% passing.

---

## 5. Implementation Roadmap (Phases B through I)

1. **Phase B — Identity Management & Context Refactoring:**
   - Update `StudentContext.tsx`: Start with `null` / empty identity if no BRN is explicitly stored in `localStorage` (do NOT default to hardcoded ID). Provide `identifyStudent(brn)` and `clearStudent()`.
   - Update `client.ts`: Ensure `X-Student-Id` interceptor handles empty state gracefully.
2. **Phase C — Identification Landing View & Navbar Redesign:**
   - Create `StudentIdentificationCard.tsx`: Dedicated hero card when no student is identified with BRN input, validation helper, and "Use Demo ID" chips.
   - Redesign `Navbar.tsx`: Compact student chip (`BRN: 2015...`) with a `Switch Student` button.
   - Create `SwitchStudentModal.tsx`: Confirmation modal that invokes `clearStudent()`, flushes TanStack Query cache via `queryClient.clear()`, and resets active hold view.
3. **Phase D — Context-Aware Class Action Buttons:**
   - Refactor `ClassList.tsx` button logic to evaluate the exact relationship between the current class and the student's hold history.
4. **Phase E — Admin Dashboard Enhancements:**
   - Add search input and shift filters ("All Shifts", "Morning Shift", "Day Shift") to `AdminDashboard.tsx`.
   - Add "Demo Admin Portal (No Auth Required)" banner.
5. **Phase F & G — Verification & Automated Tests:**
   - Add Vitest tests for student switching, cache invalidation, and button state matrix.
   - Re-run full test suites (`dotnet test` + `npm test`).
6. **Phase H & I — Documentation & Git Checkpoints:**
   - Update `README.md`, `ASSUMPTIONS.md`, `AI_USAGE.md`, `REQUIREMENT_TRACEABILITY.md`.
   - Commit changes with Conventional Commits.
