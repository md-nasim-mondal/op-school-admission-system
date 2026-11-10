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
- **C# / .NET 8 (ASP.NET Core Web API)**
- **Architecture:** Modular Monolith with clean separation of concerns:
  - `SchoolAdmission.Domain`: Core entities (`ClassEntity`, `AdmissionHold`), enums (`HoldStatus`), invariants, domain exceptions.
  - `SchoolAdmission.Application`: Use cases, DTOs, FluentValidation rules (`CreateClassRequestValidator`, `StudentIdValidator`), service interfaces.
  - `SchoolAdmission.Infrastructure`: Entity Framework Core 8, Npgsql PostgreSQL provider, PostgreSQL row-level locking (`SELECT ... FOR UPDATE`), `HoldExpirationBackgroundService` worker.
  - `SchoolAdmission.Api`: Thin REST controllers, Global Exception Handling Middleware (translating domain errors to appropriate 4xx/5xx responses), OpenAPI/Swagger.
- **Concurrency Control:** Multi-tier database-level concurrency protection:
  - **Class-Level Seat Protection:** Explicit pessimistic row locking (`SELECT ... FOR UPDATE`) on the class record inside read-committed transactions guarantees `HeldSeats + ConfirmedSeats <= TotalSeats` under high simultaneous load.
  - **Student-Level Cross-Class Protection:** PostgreSQL transaction-scoped advisory locks (`SELECT pg_advisory_xact_lock(hashtext(studentId))`) serialize hold requests for the same student across different classes, preventing race conditions.

### Frontend
- **React 19** + **TypeScript** (Strict Mode)
- **Vite** bundler
- **Tailwind CSS v4** for clean, responsive UI design
- **TanStack Query (React Query v5)** for optimistic UI updates, automated background polling (every 5s for real-time seat counts), and cache management
- **Axios** with request interceptors for the `X-Student-Id` header
- **Lucide React** icons

### Infrastructure & Database
- **PostgreSQL 16 (Alpine)**
- **Docker** multi-stage builds (.NET 8 SDK -> lean ASP.NET runtime; Node 22 build -> Nginx Alpine runtime)
- **Docker Compose** orchestration with health checks and persistent volume `pg_data`.

---

## 3. Repository Structure

```text
school-admission-system/
├── docker-compose.yml          # Root Docker Compose orchestrating DB, Backend, Frontend
├── .env.example                # Example environment configuration
├── README.md                   # Complete system and setup documentation
├── REQUIREMENT_TRACEABILITY.md # 32-item assignment requirement verification matrix
├── ASSUMPTIONS.md              # Detailed documentation of all engineering assumptions
├── AI_USAGE.md                 # Record of AI tool usage, corrections, and verifications
│
├── backend/
│   ├── SchoolAdmission.sln
│   ├── Dockerfile              # Multi-stage production Dockerfile (.NET 8)
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
    ├── Dockerfile              # Multi-stage production Dockerfile (Nginx)
    ├── nginx.conf              # SPA routing fallback configuration
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── api/                # API clients for classes and holds
    │   ├── components/         # Navbar, ClassList, ActiveHoldCard, CountdownTimer, AdminDashboard
    │   ├── types/              # TypeScript contracts matching backend DTOs
    │   ├── test/               # Vitest unit tests for components
    │   ├── App.tsx             # Main application orchestrator
    │   └── main.tsx
```

---

## 4. Getting Started with Docker

### Prerequisites
- Docker (20.10+)
- Docker Compose (v2+)

### Quick Start
To build and start all services (PostgreSQL, Backend API, Frontend UI):

```bash
docker compose up --build
```

Once started:
- **Frontend UI:** Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Backend API:** Accessible at [http://localhost:8080](http://localhost:8080).
- **Interactive Swagger UI:** Open [http://localhost:8080/swagger](http://localhost:8080/swagger).
- **Backend Health Check:** Open [http://localhost:8080/health](http://localhost:8080/health).

### Stopping the Application
```bash
docker compose down
```
*Note: Existing database data is persisted in the Docker named volume `pg_data` and will safely survive container stop/restart.*

---

## 5. Environment Variables Reference

| Variable | Default Value | Description |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Database superuser |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `school_admission_db` | Database name |
| `DB_PORT` | `5434` | Host port mapped to PostgreSQL container (avoids host port 5432 conflicts) |
| `DATABASE_URL` | `Host=db;Port=5432;...` | PostgreSQL connection string used by backend |
| `HOLD_DURATION_SECONDS` | `600` | Seat hold duration in seconds (default 10 minutes) |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API URL used by the React frontend |

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

The repository includes a comprehensive test suite covering Unit tests, Integration tests, and High-Concurrency stress tests.

### Running Backend Tests
Ensure .NET 8 SDK is installed and PostgreSQL is running (or start the test container):

```bash
cd backend
dotnet test
```

#### Test Breakdown:
- **Unit Tests (19 tests):**
  - `ClassEntityTests`: Verifies correct calculation of held, confirmed, and available seats, ensuring expired holds are never counted.
  - `AdmissionHoldTests`: Verifies ownership checks, expiration checks, cancellation rules, and confirmation idempotency.
  - `ValidatorTests`: Verifies 17-digit birth registration number string format, leading zeros preservation, and class seat capacity validation.
- **Integration Tests (12 tests):**
  - Full API lifecycle tests (`ClassApiTests`, `HoldAndAdmissionWorkflowTests`).
  - **Mandatory Concurrency Test (`SeatAllocationConcurrencyTests`):** Fires 100 simultaneous HTTP requests across threads against a class with only 10 seats. Asserts that exactly 10 requests succeed (201 Created), 90 fail (409 Conflict), and the final database state contains exactly 10 held seats and 0 available seats.
  - **Two-Process Race Condition Test:** 2 independent clients racing for the last 1 available seat. Verifies that exactly 1 wins and the other receives 409 Conflict.

### Running Frontend Tests
```bash
cd frontend
npm test
```
Executes Vitest tests verifying `CountdownTimer` and `Badge` component behaviors.

---

## 8. Verification & Persistence Checklist

- [x] Application compiles cleanly (.NET 8 C# + React 19 TypeScript).
- [x] Multi-stage Dockerfiles and root `docker-compose.yml` operational.
- [x] Database health check and automatic EF Core migration on startup.
- [x] PostgreSQL named volume `pg_data` preserves data across `docker compose down` and `docker compose up`.
- [x] Concurrency safety invariant `HeldSeats + ConfirmedSeats <= TotalSeats` verified under 100 simultaneous requests.
- [x] Auto-expiring background worker and on-the-fly expiration validation.
- [x] Live countdown timer and automated polling (every 5s) on the frontend.
- [x] Student identity preserved in `localStorage` across page reloads.
