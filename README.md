# School Admission System

**Recruitment Project — Assistant Software Engineer**  
**Organization:** Onnorokom Projukti Limited  
**Target Technology Stack:** C# / .NET 8+ · PostgreSQL · React 19+ (TypeScript & Vite) · Docker & Docker Compose  

---

## 1. Overview & Business Scenario

A private school opens online admission for a new academic year on a strict **First-Come, First-Served** basis (no lottery). 
Each class shift (e.g., *"Class 6 - Morning Shift"* with 120 seats, *"Class 6 - Day Shift"* with 100 seats) is treated as an independent admission class with its own fixed capacity. When admission opens, thousands of parents apply simultaneously.

### Core Business Rules
1. **Seat Hold & First-Come First-Served:** When a parent applies, a seat is put on `HELD` status under the student's name for a temporary duration (`HOLD_DURATION_SECONDS`, default **600 seconds**).
2. **Concurrency Safety:** Under no circumstance can `HeldSeats + ConfirmedSeats > TotalSeats` in any class, regardless of simultaneous concurrent requests.
3. **Automatic Expiration:** If the admission fee is not paid within the hold window, the hold expires (`EXPIRED`), and the seat automatically reopens for other applicants without requiring any manual intervention or API calls.
4. **Single Active Hold Invariant:** A student (identified by their 17-digit Birth Registration Number) cannot hold multiple active seats simultaneously across any classes.
5. **Idempotent Confirmation:** Repeated payment/confirmation requests on the same hold never double-count confirmed seats.
6. **Persistence:** All data survives server and Docker container restarts.

---

## 2. Technology Stack & Architecture

### Backend
- **C# 12 / .NET 8 (ASP.NET Core Web API)**
- **Modern Idioms & Performance:** Primary constructors across controllers/middleware, compile-time `[GeneratedRegex]` source generator, collection expressions `[]`, cached `JsonSerializerOptions` (CA1869), and `static readonly` CORS fallback array (CA1861).
- **Architecture:** Modular Monolith with clean separation of concerns:
  - `SchoolAdmission.Domain`: Core entities (`ClassEntity`, `AdmissionHold`), enums (`HoldStatus`), invariants, domain exceptions.
  - `SchoolAdmission.Application`: Use cases, DTOs, FluentValidation rules (`CreateClassRequestValidator`, `StudentIdValidator`), service interfaces.
  - `SchoolAdmission.Infrastructure`: Entity Framework Core 8, Npgsql PostgreSQL provider, PostgreSQL row-level locking (`SELECT ... FOR UPDATE`), `HoldExpirationBackgroundService` worker.
  - `SchoolAdmission.Api`: Thin REST controllers, Global Exception Handling Middleware (translating domain errors to appropriate 4xx/5xx responses), OpenAPI/Swagger UI v3.0.1.
- **Concurrency Control:** Multi-tier database-level concurrency protection:
  - **Class-Level Seat Protection:** Explicit pessimistic row locking (`SELECT ... FOR UPDATE`) on the class record inside read-committed transactions guarantees `HeldSeats + ConfirmedSeats <= TotalSeats` under high simultaneous load.
  - **Student-Level Cross-Class Protection:** PostgreSQL transaction-scoped advisory locks (`SELECT pg_advisory_xact_lock(hashtext(studentId))`) serialize hold requests for the same student across different classes, preventing race conditions.

### Frontend
- **React 19** + **TypeScript** (Strict Mode, zero `any` types)
- **React Router v7** with modular layout (`MainLayout`), lazy route `Suspense` loading (`PageLoader`), wildcard `404` page (`NotFoundPage`), route `errorElement` (`ErrorPage`), and top-level `GlobalErrorBoundary`
- **Vite 6** bundler
- **Tailwind CSS v4** for clean, responsive UI design
- **TanStack Query (React Query v5)** for optimistic UI updates, automated background polling (every 5s for real-time seat counts), and cache management
- **Axios** with request interceptors for the `X-Student-Id` header
- **Lucide React** icons

### Infrastructure & Database
- **PostgreSQL 16 (Alpine)**
- **Docker** multi-stage builds (.NET 8 SDK -> lean ASP.NET runtime; Node 26 Active LTS Alpine build -> hardened `nginx:1.31.8-alpine-slim` runtime with `apk upgrade --no-cache`)
- **Docker Compose** orchestration with health checks and persistent volume `pg_data`.

---

## 3. Repository Structure

```text
school-admission-system/
├── docker-compose.yml                      # Root Docker Compose orchestrating DB, Backend, Frontend
├── .env.example                            # Example environment configuration
├── README.md                               # Complete system and setup documentation
├── REQUIREMENT_TRACEABILITY.md             # 32-item assignment requirement verification matrix
├── ASSUMPTIONS.md                          # Detailed documentation of all engineering assumptions
├── AI_USAGE.md                             # Record of AI tool usage, corrections, and verifications
├── FINAL_ASSIGNMENT_COMPLIANCE_REPORT.md   # Phase 5 strict compliance audit report
├── FINAL_RELEASE_READINESS_REPORT.md       # Phase 6 release readiness report
├── e2e_evidence/                           # 9 Live Chrome CDP E2E screenshots (verified across UI states)
│
├── backend/
│   ├── .env.example                        # Example environment configuration for local .NET dev
│   ├── .dockerignore                       # Excludes bin/obj/secrets from Docker build context
│   ├── SchoolAdmission.sln
│   ├── Dockerfile                          # Cached NuGet restore + multi-stage .NET 8 build
│   ├── src/
│   │   ├── SchoolAdmission.Domain/          # Core entities, enums, domain exceptions
│   │   ├── SchoolAdmission.Application/     # DTOs, interfaces, FluentValidation
│   │   ├── SchoolAdmission.Infrastructure/  # EF Core, Npgsql, migrations, background service
│   │   └── SchoolAdmission.Api/             # Controllers, middlewares, Program.cs
│   └── tests/
│       ├── SchoolAdmission.UnitTests/        # 19 Unit tests (domain rules, validators)
│       └── SchoolAdmission.IntegrationTests/ # 13 Integration tests (concurrency, race conditions, workflows)
│
└── frontend/
    ├── .env.example                        # Example Vite API base URL config for local dev
    ├── .dockerignore                       # Excludes node_modules/dist from Docker context
    ├── Dockerfile                          # BuildKit-cached npm ci (Node 26 LTS) + nginx:1.31.8-alpine-slim
    ├── nginx.conf                          # SPA routing fallback configuration
    ├── scripts/
    │   └── ensure-deps.mjs                 # Smart dependency hash check (skips redundant npm install)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/                            # API client & endpoint modules (classes.ts, holds.ts, client.ts)
        ├── components/
        │   ├── layout/                     # Navbar, Footer, StudentIdInput, SwitchStudentModal
        │   ├── student/                    # StudentIdentificationCard, ActiveHoldSection, StatusBanner
        │   ├── ActiveHoldCard.tsx          # Active application card with live countdown & payment trigger
        │   ├── AdminDashboard.tsx          # Admin capacity management, shift filters, loading/error states
        │   ├── ApplicationHistory.tsx      # Student application history table
        │   ├── Badge.tsx                   # Status badges (HELD, CONFIRMED, EXPIRED, CANCELLED)
        │   ├── ClassList.tsx               # Class grid with live seat counts, loading/error & action states
        │   ├── CountdownTimer.tsx          # Live MM:SS timer with auto-expiration callback
        │   ├── CreateClassModal.tsx        # Admin class creation modal
        │   ├── ErrorBoundary.tsx           # Top-level React GlobalErrorBoundary
        │   ├── ErrorFallbackCard.tsx       # Unified accessible error alert & recovery actions
        │   ├── LoadingState.tsx            # Semantic <progress> spinner, skeletons, and PageLoader
        │   └── Toast.tsx                   # Toast notifications
        ├── context/                        # StudentContext, ToastContext
        ├── layouts/                        # MainLayout with header, Suspense PageLoader, and footer
        ├── pages/                          # StudentPortalPage, AdminPage, ErrorPage, NotFoundPage
        ├── routes/                         # React Router v7 routes, errorElement boundaries & 404 wildcard
        ├── test/                           # 26 Vitest unit & integration tests across 5 suites
        ├── types/                          # TypeScript interfaces matching backend DTOs
        ├── utils/                          # errors.ts (safe unknown error extraction helper)
        ├── App.tsx                         # App root with GlobalErrorBoundary, QueryClient, and RouterProvider
        └── main.tsx
```

---

## 4. Getting Started & Running the Project

You can run the system in two ways:
1. **Via Docker Compose (Recommended):** Spins up PostgreSQL, Backend API, and Frontend SPA together with a single command.
2. **Locally for Development (Hybrid / Non-Docker):** Run PostgreSQL via Docker (or local install), and run the .NET 8 backend and Vite frontend directly on your host machine for live debugging and hot-reloading.

---

### 4.1 Running with Docker Compose (Full Stack)

#### Prerequisites
- Docker (20.10+)
- Docker Compose (v2+)

#### Start All Services
```bash
docker compose up --build
```

Once started:
- **Frontend UI:** Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Backend API:** Accessible at [http://localhost:8080](http://localhost:8080).
- **Interactive Swagger UI:** Open [http://localhost:8080/swagger](http://localhost:8080/swagger).
- **Backend Health Check:** Open [http://localhost:8080/health](http://localhost:8080/health).

#### Stopping the Application
```bash
docker compose down
```
*Note: Existing database data is persisted in the Docker named volume `pg_data` and will safely survive container stop/restart.*

---

### 4.2 Running Locally for Development (Hybrid / Non-Docker)

#### Prerequisites
- **.NET 8 SDK** installed (`dotnet --version`)
- **Node.js 20+** and **npm** installed (`node -v`, `npm -v`)
- **Docker** (to run the PostgreSQL container, or an existing local PostgreSQL 15+ instance)

#### Step 1: Start PostgreSQL
If using Docker for just the database, start the container mapped to port `5434` (to prevent any conflict with a default PostgreSQL instance on 5432):
```bash
docker compose up -d db
```

#### Step 2: Configure & Run the Backend API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Run the backend Web API:
   ```bash
   dotnet run --project src/SchoolAdmission.Api
   ```
   *The backend will automatically apply any pending EF Core database migrations on startup and start listening at [http://localhost:8080](http://localhost:8080).*
   *Swagger UI will be available at [http://localhost:8080/swagger](http://localhost:8080/swagger).*

#### Step 3: Configure & Run the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. (Optional) Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the Vite development server directly (no repeated manual `npm install` needed — `predev`/`prebuild`/`pretest` automatically verify `package.json` & `package-lock.json` hashes via `scripts/ensure-deps.mjs` and skip installation unless dependencies changed or `node_modules` is missing):
   ```bash
   npm run dev
   ```
   *(If preferred, you can still run `npm ci` manually the very first time; subsequent runs skip installation automatically.)*

   *The Vite dev server will start at [http://localhost:5173](http://localhost:5173) with instant hot-module replacement (HMR).*

4. (Alternative: Production Preview) If you wish to test the production build locally without Docker:
   ```bash
   npm run build
   npm run preview -- --port 3000
   ```

---

## 5. Environment Variables Reference

The project includes separate `.env.example` templates for root Docker Compose, backend local development, and frontend local development:

- `/.env.example` — Master configuration for Docker Compose.
- `/backend/.env.example` — Connection strings and runtime settings for running the backend locally.
- `/frontend/.env.example` — API base URL for running the frontend Vite dev server locally.

| Variable | Default Value | Scope | Description |
|---|---|---|---|
| `POSTGRES_USER` | `postgres` | Docker / DB | Database superuser |
| `POSTGRES_PASSWORD` | `postgres` | Docker / DB | Database password |
| `POSTGRES_DB` | `school_admission_db` | Docker / DB | Database name |
| `DB_PORT` | `5434` | Docker / DB | Host port mapped to PostgreSQL container (avoids host port 5432 conflicts) |
| `DATABASE_URL` | `Host=db;Port=5432;...` | Backend | PostgreSQL connection string used by backend |
| `HOLD_DURATION_SECONDS` | `600` | Backend | Seat hold duration in seconds (default 10 minutes) |
| `ASPNETCORE_URLS` | `http://localhost:8080` | Backend | Port and host binding for ASP.NET Core API |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Frontend | Backend API URL used by the React frontend |

---

## 6. API Specification & Contract

The backend implements all 8 mandatory endpoints according to the specification. All request and response bodies use JSON. Student identity is provided via the `X-Student-Id` header (17-digit Birth Registration Number).

### 1. `POST /classes`
Create a new admission class or shift.
- **Request Body:**
  ```json
  {
    "name": "Class 6 - Morning Shift",
    "totalSeats": 120
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "c_a1b2c3d4",
    "name": "Class 6 - Morning Shift",
    "totalSeats": 120
  }
  ```

### 2. `GET /classes`
Retrieve all classes with live seat counts.
- **Response (200 OK):**
  ```json
  [
    {
      "id": "c_a1b2c3d4",
      "name": "Class 6 - Morning Shift",
      "totalSeats": 120,
      "heldSeats": 15,
      "confirmedSeats": 80,
      "availableSeats": 25
    }
  ]
  ```

### 3. `GET /classes/{classId}`
Retrieve seat details for a specific class.
- **Response (200 OK):**
  ```json
  {
    "id": "c_a1b2c3d4",
    "name": "Class 6 - Morning Shift",
    "totalSeats": 120,
    "heldSeats": 15,
    "confirmedSeats": 80,
    "availableSeats": 25
  }
  ```

### 4. `POST /classes/{classId}/holds`
Apply for a seat hold.
- **Header:** `X-Student-Id: 20152691234567890`
- **Response (201 Created):**
  ```json
  {
    "holdId": "h_789abcde",
    "classId": "c_a1b2c3d4",
    "studentId": "20152691234567890",
    "status": "HELD",
    "expiresAt": "2026-11-10T08:10:00Z"
  }
  ```
- **Response (409 Conflict):** If no seats are available or if the student already holds a seat.

### 5. `GET /holds/{holdId}`
Get current status and expiration of a hold.
- **Response (200 OK):**
  ```json
  {
    "holdId": "h_789abcde",
    "classId": "c_a1b2c3d4",
    "status": "HELD",
    "expiresAt": "2026-11-10T08:10:00Z"
  }
  ```
  *Status values: `HELD`, `CONFIRMED`, `EXPIRED`, `CANCELLED`.*

### 6. `POST /holds/{holdId}/confirm`
Confirm admission (simulates payment).
- **Header:** `X-Student-Id: 20152691234567890`
- **Response (200 OK):**
  ```json
  {
    "holdId": "h_789abcde",
    "status": "CONFIRMED"
  }
  ```

### 7. `DELETE /holds/{holdId}`
Cancel an active admission hold and release the seat.
- **Header:** `X-Student-Id: 20152691234567890`
- **Response (204 No Content):** Successful cancellation.

### 8. `GET /me/holds`
List all applications submitted by the student.
- **Header:** `X-Student-Id: 20152691234567890`
- **Response (200 OK):**
  ```json
  [
    {
      "holdId": "h_789abcde",
      "classId": "c_a1b2c3d4",
      "className": "Class 6 - Morning Shift",
      "status": "HELD",
      "expiresAt": "2026-11-10T08:10:00Z"
    }
  ]
  ```

---

## 7. Automated Testing Suite

The repository includes a comprehensive 58-test automated testing suite covering Unit tests, Integration tests, High-Concurrency stress tests, and UI component/router tests.

### Running Backend Tests
Ensure .NET 8 SDK is installed and PostgreSQL is running (or start the test container):

```bash
# Run all tests (Unit + Integration + Concurrency)
dotnet test backend/SchoolAdmission.sln

# Or with Release configuration
dotnet test backend/SchoolAdmission.sln -c Release
```

#### Test Breakdown (32 Tests — 100% Passing):
- **Unit Tests (19 tests in `SchoolAdmission.UnitTests`):**
  - `ClassEntityTests`: Verifies correct calculation of held, confirmed, and available seats, ensuring expired holds are never counted and available seats never drop below zero.
  - `AdmissionHoldTests`: Verifies ownership checks (403 Forbidden), expiration transitions, cancellation rules, and confirmation idempotency.
  - `ValidatorTests`: Verifies strict 17-digit birth registration number string format (`^\d{17}$`), leading zero preservation, and class seat capacity validation.
- **Integration Tests (13 tests in `SchoolAdmission.IntegrationTests`):**
  - Full API lifecycle tests (`ClassApiTests`, `HoldAndAdmissionWorkflowTests`).
  - **Mandatory 100-Request Concurrency Stress Test (`SeatAllocationConcurrencyTests.ConcurrentHoldRequests_ShouldNeverOverAllocateSeats`):** Fires 100 simultaneous HTTP requests across threads against a class with only 10 seats. Asserts that exactly 10 requests succeed (201 Created), 90 fail (409 Conflict), and the final database state contains exactly 10 held seats and 0 available seats.
  - **Two-Process Race Condition Test (`TwoConcurrentClients_RacingForLastSeat_ExactlyOneWins`):** 2 independent clients racing for the last 1 available seat. Verifies that exactly 1 wins and the other receives 409 Conflict.
  - **Cross-Class Advisory Lock Test (`SameStudent_SimultaneousHoldRequestsAcrossDifferentClasses_ExactlyOneSucceeds`):** When the same student fires simultaneous hold requests across different classes at the exact same millisecond, PostgreSQL transaction advisory locks serialize the requests, allowing exactly 1 hold to be created and returning 409 Conflict for the second.

### Running Frontend Tests
```bash
# Run Vitest test suite
npm --prefix frontend test -- --run

# Run production build check
npm --prefix frontend run build
```

#### Test Breakdown (26 Tests across 5 suites — 100% Passing):
- `Badge.test.tsx` (4 tests): Verifies status badge labels and CSS styling for `HELD`, `CONFIRMED`, `EXPIRED`, and `CANCELLED`.
- `CountdownTimer.test.tsx` (2 tests): Verifies real-time MM:SS countdown formatting and zero-expiration callback invocation.
- `StudentIdentityWorkflow.test.tsx` (6 tests): Verifies anonymous fresh visitor state, manual "Submit ID" confirmation preventing premature auto-save while typing, locking/disabling the BRN input once committed until "Switch Student" is clicked, "Demo ID" quick-fill helper without auto-save, 17-digit BRN validation, leading zero preservation, and student switching with cache purging (`queryClient.clear()`).
- `ClassActionStates.test.tsx` (7 tests): Verifies all dynamic class button states:
  - `Enter BRN Above to Apply` (unidentified visitor)
  - `Apply for Admission` (eligible to apply)
  - `Holding Seat...` (mutation in progress)
  - `Continue Application` (already holds seat in this class)
  - `Admission Confirmed` (confirmed in this class)
  - `Already Admitted to Another Class` (confirmed in another class)
  - `Application Already Active` (holds seat in another class)
  - `No Seats Available` (class is full)
  - `Apply Again` (eligible to reapply after previous hold expired or cancelled)
- `GlobalFeedbackStates.test.tsx` (7 tests): Verifies top-level `GlobalErrorBoundary`, React Router `errorElement` (`ErrorPage`), unmatched wildcard `404` `NotFoundPage` inside `MainLayout`, semantic `<progress>` `LoadingState` / `PageLoader`, and retryable API error states in `ClassList` and `AdminDashboard`.

---

## 8. Verification & Persistence Checklist

- [x] Application compiles cleanly (.NET 8 C# in Release mode + React 19 TypeScript).
- [x] Multi-stage Dockerfiles and root `docker-compose.yml` operational.
- [x] Database health check and automatic EF Core migration on startup.
- [x] PostgreSQL named volume `pg_data` preserves data across `docker compose down` and `docker compose up`.
- [x] Concurrency safety invariant `HeldSeats + ConfirmedSeats <= TotalSeats` verified under 100 simultaneous requests.
- [x] Multi-class same-student race conditions prevented via PostgreSQL advisory locks (`pg_advisory_xact_lock`).
- [x] Auto-expiring background worker and on-the-fly expiration validation.
- [x] Live countdown timer and automated polling (every 5s) on the frontend.
- [x] Top-of-page 17-digit BRN input box (`#top-brn-input`) per exact Bengali assignment wording:
  *"Login লাগবে না। Page-এর উপরে একটা ঘরে শিক্ষার্থীর জন্ম নিবন্ধন নম্বর লেখা যাবে। UI এটাকেই শিক্ষার্থীর পরিচয় হিসেবে ধরে নেবে। API-তে শিক্ষার্থীর পরিচয় আসবে X-Student-Id header দিয়ে।"*
- [x] Explicit **Submit ID** confirmation + non-auto-saving **Demo ID** quick-fill helper + **locked (`disabled`) BRN input** once committed until **Switch Student** is clicked (preventing accidental mid-session edits).
- [x] Global React `GlobalErrorBoundary`, React Router `errorElement` (`ErrorPage`), dedicated wildcard `404` `NotFoundPage`, accessible `<progress>` loading states (`LoadingState`, lazy-route `PageLoader`), and strict zero-`any` TypeScript coverage.
- [x] Fully responsive layout verified in Google Chrome across **260px ultra-narrow mobile, 320px, 375px, 768px tablet, and 1280px+ desktop** (0 horizontal overflows; `@container`-driven responsive stacked table cards on narrow screens).
- [x] Clean student switching with confirmation modal and client query cache purging (`queryClient.clear()`), with full server-side PostgreSQL hold preservation.
- [x] Admin Demonstration Portal (`/admin`) for class creation, shift filtering (`All Shifts`, `Morning Shift`, `Day Shift`), and capacity monitoring without authentication.
- [x] All 8 mandatory REST API endpoints verified against original contracts (plus manual Swagger OpenAPI `3.0.1` UI verification).
- [x] Complete documentation, 58 automated tests (32 Backend + 26 Frontend), and live Chrome E2E verification evidence tracked:
  - `README.md`: Complete system architecture, Docker Compose, and local development run guide
  - `ASSUMPTIONS.md`: 10 core engineering and domain decisions
  - `AI_USAGE.md`: Full record of AI pair-programming assistance, human manual QA discoveries, and critical corrections
  - `REQUIREMENT_TRACEABILITY.md`: 32-item assignment requirement traceability matrix
  - `FINAL_ASSIGNMENT_COMPLIANCE_REPORT.md`: Phase 5 strict compliance audit report
  - `FINAL_RELEASE_READINESS_REPORT.md`: Phase 6 release readiness report
  - `e2e_evidence/`: 9 live Chrome DevTools Protocol browser verification screenshots
