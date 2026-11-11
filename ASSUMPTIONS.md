# ASSUMPTIONS.md
## School Admission System — Engineering Assumptions & Design Decisions

This document details all technical and architectural assumptions made during the design, implementation, and delivery of the School Admission System for Onnorokom Projukti Limited.

---

### 1. Student Identity & Birth Registration Number (BRN)
- **Assumption:** The student identifier (`X-Student-Id` request header) is modeled as a **17-digit string**, not a numeric type.
- **Reasoning:** In Bangladesh, official birth registration numbers are 17-digit identifiers that may contain leading zeros. Storing them as integer types (`long`/`int64`) would truncate leading zeros and cause data corruption.
- **Validation:** Both the backend (`StudentIdValidator`) and the frontend enforce strict regex `^\d{17}$`. Leading zeros are preserved across all layers and database columns (`character varying(17)`).

---

### 2. Single Active Hold Scope & State Invariants
- **Assumption:** A student may have only one active hold or confirmed admission at any time across the entire system.
- **Reasoning:** In competitive school admissions with high demand, allowing a parent to hold seats in multiple classes or shifts simultaneously leads to artificial seat hoarding.
- **Rule Implementation:**
  - If a student currently has a hold with status `HELD` where `ExpiresAtUtc > now`, or a hold with status `CONFIRMED`, any new hold request is rejected with `409 Conflict`.
  - Once a hold reaches `EXPIRED` or `CANCELLED`, the student is immediately free to apply for any available class.

---

### 3. Dual-Layer Hold Expiration (Defense in Depth)
- **Assumption:** Hold expiration must function correctly both with and without the background worker running.
- **Reasoning:** Relying exclusively on a background service creates race windows where a hold might have expired chronologically, but the background cron job has not yet executed its sweep.
- **Design:**
  1. **Background Service (`HoldExpirationBackgroundService`):** Sweeps the database every 5 seconds to mark overdue `HELD` rows as `EXPIRED`.
  2. **On-The-Fly Synchronous Evaluation:** Whenever `/classes`, `/classes/{id}/holds`, `/holds/{id}`, or `/me/holds` are evaluated, expired holds are dynamically excluded from held seats and marked as `EXPIRED` within the database transaction.
  - This guarantees 100% accuracy and zero stale seat reservations.

---

### 4. Database-Level Concurrency Control (`SELECT FOR UPDATE` & `pg_advisory_xact_lock`)
- **Assumption:** Concurrency protection must be enforced at the database level rather than application memory, protecting both class-level seat limits and student-level hold uniqueness.
- **Reasoning:** In-memory C# locks (`lock`, `SemaphoreSlim`) only work within a single process. In real-world deployments (and as specified in the bonus criteria), multiple backend instances or container replicas operate simultaneously against the same PostgreSQL database. Furthermore, if a student concurrently attempts to hold seats in two *different* classes at the exact same millisecond, row locking Class A and Class B independently would not serialize the student check.
- **Design:** When a seat hold is requested:
  1. A PostgreSQL transaction is opened (`IsolationLevel.ReadCommitted`).
  2. A transaction-scoped advisory lock is acquired on the student identifier: `SELECT pg_advisory_xact_lock(hashtext(@studentId))`. This serializes all simultaneous hold attempts by the same student across ANY class.
  3. The target class record is explicitly locked via `SELECT * FROM "Classes" WHERE "Id" = @id FOR UPDATE`.
  4. Overdue holds for that class and student are transitioned to `EXPIRED`.
  5. The student's active hold count is checked. If an active or confirmed hold exists, `409 Conflict` is returned.
  6. Active and confirmed counts are recalculated under the row lock.
  7. If `heldCount + confirmedCount < totalSeats`, the new hold is inserted and committed.
  8. Any competing requests for that same class wait until the lock is released, completely preventing any over-allocation.
  9. Both locks are automatically released by PostgreSQL upon transaction commit or rollback.

---

### 5. Dynamic Derived Seat Availability
- **Assumption:** Seat availability is computed on demand: `AvailableSeats = Math.Max(0, TotalSeats - HeldSeats - ConfirmedSeats)`.
- **Reasoning:** Storing mutable `AvailableSeats` or `HeldSeats` columns on the `Classes` table introduces severe cache invalidation, counter drift, and dirty read risks. Computing counts dynamically from the immutable hold history under transaction locks guarantees mathematical consistency without distributed locks.

---

### 6. Idempotent Confirmation
- **Assumption:** Repeated confirmation calls on the same hold must be completely safe and idempotent.
- **Reasoning:** Network retries, double-clicks by parents, or client timeout retries could cause duplicate `POST /holds/{holdId}/confirm` requests.
- **Design:** If a hold is already `CONFIRMED`, subsequent confirmation requests return `200 OK` with status `CONFIRMED` without incrementing seats or overwriting `ConfirmedAtUtc`.

---

### 7. Cancellation Safety & Confirmed Status Protection
- **Assumption:** Once an admission is `CONFIRMED`, it cannot be cancelled through the student API.
- **Reasoning:** Confirmed admissions represent legally completed student enrollments with paid fees. Allowing unauthenticated client cancellation would introduce severe fraud and accidental enrollment loss. Cancellations are only permitted on active `HELD` applications.

---

### 8. Simulated Payment Flow
- **Assumption:** No external banking/gateway credentials or webhooks are needed.
- **Reasoning:** The assignment specifically states: *"ভি ভর্তি ফি দিন' চাপলে ধরে নেবেন payment সফল হয়েছে। আসল payment gateway লাগবে না।"*
- **Design:** Clicking "Pay Admission Fee" triggers `POST /holds/{holdId}/confirm`, instantly transitioning the hold from `HELD` to `CONFIRMED`.

---

### 9. Host Port Configuration for PostgreSQL Container
- **Assumption:** The host port mapped to PostgreSQL in `docker-compose.yml` defaults to `5434:5432` (or configurable via `${DB_PORT:-5434}`).
- **Reasoning:** Many developer workstations already run a local PostgreSQL service on host port 5432. Mapping host port 5434 prevents port-collision failures while the internal Docker Compose bridge network (`school_net`) allows the backend container to connect directly to `db:5432`.

---

### 10. Student Identification Workflow, Top-of-Page BRN Input & Student Switching
- **Assumption:** No conventional authentication (passwords, JWT, OTP, registration) is required or permitted by the assignment.
- **Specification Alignment:** Per the exact assignment instruction (*"Login লাগবে না। Page-এর উপরে একটা ঘরে শিক্ষার্থীর জন্ম নিবন্ধন নম্বর লেখা যাবে। UI এটাকেই শিক্ষার্থীর পরিচয় হিসেবে ধরে নেবে। API-তে শিক্ষার্থীর পরিচয় আসবে X-Student-Id header দিয়ে।"*):
  1. The 17-digit BRN input box is positioned directly and prominently at the top of the page (`#top-brn-input`) in the application header.
  2. A fresh visitor does NOT receive a hardcoded identity. The input starts blank, and the student or parent enters their 17-digit Birth Registration Number.
  3. Real-time validation checks for exactly 17 numeric digits (`^\d{17}$`) and preserves leading zeros throughout.
  4. Once a valid 17-digit BRN is entered, it is immediately recognized as the active student identifier, injected into every API request via the `X-Student-Id` header, and persisted in `localStorage`.
  5. An explicit "Switch Student" button appears alongside the input. Clicking it prompts a confirmation dialog, clears the student identifier from storage, and purges the TanStack Query client cache (`queryClient.clear()`).
  6. Database records, active holds, and admissions for the previous student remain intact on PostgreSQL, ensuring clean isolation when switching between applicants.
  7. Hardcoded demo student preset buttons are omitted from the production interface to maintain pure assignment fidelity.
  8. Class action buttons dynamically communicate the precise status: `Apply for Admission`, `Continue Application`, `Admission Confirmed`, `Already Admitted to Another Class`, `Application Already Active`, `No Seats Available`, and `Apply Again` (when eligible after expiration/cancellation).
