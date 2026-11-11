# Requirement Traceability Matrix — School Admission System

**Project:** School Admission System  
**Organization:** Onnorokom Projukti Limited  
**Audit Date:** 2026-11-10  
**Status:** 100% VERIFIED PASS  

---

## 1. Traceability Matrix

| Req ID | Exact Assignment Requirement | Implementation Reference | Verification Method | Result |
|---|---|---|---|:---:|
| **REQ-01** | Backend must be built using C# / .NET 8+ Web API. | `backend/src/SchoolAdmission.Api/Program.cs`<br>`backend/SchoolAdmission.sln` | `dotnet --version` (8.0.427)<br>`dotnet build` successful | **PASS** |
| **REQ-02** | Relational database must use PostgreSQL. | `backend/src/SchoolAdmission.Infrastructure/Data/ApplicationDbContext.cs`<br>`docker-compose.yml` (`postgres:16-alpine`) | Integration tests against real PostgreSQL instance, EF Core Migrations verified | **PASS** |
| **REQ-03** | Frontend must be built using React 18+ (SPA with TypeScript & Tailwind CSS). | `frontend/package.json` (`react: ^19.0.0`, `@tailwindcss/vite: ^4.0.0`)<br>`frontend/src/App.tsx` | Production Vite build (`npm run build`), Vitest suite (`npm test`) | **PASS** |
| **REQ-04** | Complete system must run via multi-stage Dockerfiles and root `docker-compose.yml`. | `docker-compose.yml`<br>`backend/Dockerfile`<br>`frontend/Dockerfile` | `docker compose up --build -d`<br>All 3 containers healthy and running | **PASS** |
| **REQ-05** | Backend API must be accessible on `http://localhost:8080`. | `docker-compose.yml` (`8080:8080`)<br>`backend/src/SchoolAdmission.Api/appsettings.json` | `curl -f http://localhost:8080/health`<br>Status: HTTP 200 OK | **PASS** |
| **REQ-06** | Student identification via `X-Student-Id` request header (17-digit Birth Registration Number). | `backend/src/SchoolAdmission.Application/Validators/Validators.cs`<br>`frontend/src/context/StudentContext.tsx`<br>`frontend/src/components/layout/StudentIdInput.tsx` | `StudentIdValidatorTests` (Regex `^\d{17}$`)<br>Validates 17 digits, preserves leading zeros, top-of-page input box, supports student switching | **PASS** |
| **REQ-07** | No authentication/login system required. Top-of-page BRN input box per assignment wording: *"Page-এর উপরে একটা ঘরে শিক্ষার্থীর জন্ম নিবন্ধন নম্বর লেখা যাবে।"* | `frontend/src/components/layout/StudentIdInput.tsx`<br>`frontend/src/components/student/StudentIdentificationCard.tsx` | Permanent top-of-page 17-digit BRN input box (`#top-brn-input`), explicit **Submit ID** confirmation button + **Demo ID** quick-fill helper, locked input (`disabled`) until "Switch Student" without username/password | **PASS** |
| **REQ-08** | First-Come-First-Served seat allocation with temporary hold mechanism. | `backend/src/SchoolAdmission.Infrastructure/Services/AdmissionService.cs`<br>`backend/src/SchoolAdmission.Domain/Entities/AdmissionHold.cs` | Integration tests: `HoldAndAdmissionWorkflowTests.CompleteAdmissionWorkflow_ShouldSucceed` | **PASS** |
| **REQ-09** | Concurrency Safety Invariant: `heldSeats + confirmedSeats <= totalSeats` under simultaneous load. | `backend/src/SchoolAdmission.Infrastructure/Services/AdmissionService.cs` (`SELECT ... FOR UPDATE`) | `SeatAllocationConcurrencyTests.ConcurrentHoldRequests_ShouldNeverOverAllocateSeats` (100 simultaneous requests / 10 seats: 10 created, 90 conflict, 0 over-allocation) | **PASS** |
| **REQ-10** | Single active hold per student across all classes. | `backend/src/SchoolAdmission.Infrastructure/Services/AdmissionService.cs`<br>`pg_advisory_xact_lock(hashtext(studentId))` | Integration tests: `SeatAllocationConcurrencyTests.SameStudent_SimultaneousHoldRequestsAcrossDifferentClasses_ExactlyOneSucceeds` | **PASS** |
| **REQ-11** | Hold duration configurable via `HOLD_DURATION_SECONDS` environment variable (default: 600s). | `backend/src/SchoolAdmission.Infrastructure/DependencyInjection.cs`<br>`backend/src/SchoolAdmission.Application/Common/AdmissionSettings.cs` | Verified via config binding and fallback logic; Docker environment variable configured | **PASS** |
| **REQ-12** | Automatic hold expiration background worker + real-time expiry evaluation. | `backend/src/SchoolAdmission.Infrastructure/BackgroundServices/HoldExpirationBackgroundService.cs`<br>`AdmissionHold.IsExpired` | Background worker periodic timer (15s) + on-the-fly SQL expiration in `CreateHoldAsync` | **PASS** |
| **REQ-13** | Hold confirmation idempotency (duplicate confirmation requests succeed without incrementing seats). | `backend/src/SchoolAdmission.Domain/Entities/AdmissionHold.cs` (`Confirm` method) | `HoldAndAdmissionWorkflowTests.ConfirmHold_ShouldBeIdempotent` | **PASS** |
| **REQ-14** | Ownership validation (students cannot confirm or cancel another student's hold). | `backend/src/SchoolAdmission.Domain/Entities/AdmissionHold.cs`<br>`SchoolAdmission.Domain.Exceptions.ForbiddenException` | `HoldAndAdmissionWorkflowTests.ConfirmHold_ShouldReturn403_WhenStudentIdDoesNotMatch` | **PASS** |
| **REQ-15** | Strict state machine transitions: `HELD` $\to$ `CONFIRMED`, `HELD` $\to$ `EXPIRED`, `HELD` $\to$ `CANCELLED`. | `backend/src/SchoolAdmission.Domain/Entities/AdmissionHold.cs` | 19 Unit tests in `AdmissionHoldTests.cs` | **PASS** |
| **REQ-16** | `POST /classes`: Create class (returns 201 Created with `id`, `name`, `totalSeats`). | `backend/src/SchoolAdmission.Api/Controllers/ClassesController.cs` | `ClassApiTests.CreateClass_WithValidPayload_ShouldReturn201` | **PASS** |
| **REQ-17** | `GET /classes`: List all classes with dynamic seat metrics (`heldSeats`, `confirmedSeats`, `availableSeats`). | `backend/src/SchoolAdmission.Api/Controllers/ClassesController.cs` | `ClassApiTests.GetAllClasses_ShouldReturnListOfClassesWithAccurateSeatMetrics` | **PASS** |
| **REQ-18** | `GET /classes/{classId}`: Retrieve single class details with seat metrics. | `backend/src/SchoolAdmission.Api/Controllers/ClassesController.cs` | `ClassApiTests.GetClassById_WhenClassExists_ShouldReturn200` | **PASS** |
| **REQ-19** | `POST /classes/{classId}/holds`: Acquire seat hold (returns 201 Created or 409 Conflict if full). | `backend/src/SchoolAdmission.Api/Controllers/ClassesController.cs` | Live API verification script & Concurrency tests | **PASS** |
| **REQ-20** | `GET /holds/{holdId}`: Retrieve hold status and expiration time. | `backend/src/SchoolAdmission.Api/Controllers/HoldsController.cs` | `HoldAndAdmissionWorkflowTests.GetHoldById_ShouldReturnCorrectStatus` | **PASS** |
| **REQ-21** | `POST /holds/{holdId}/confirm`: Confirm hold and finalize seat admission. | `backend/src/SchoolAdmission.Api/Controllers/HoldsController.cs` | Live API verification script & `HoldAndAdmissionWorkflowTests` | **PASS** |
| **REQ-22** | `DELETE /holds/{holdId}`: Cancel active hold and release seat (204 No Content). | `backend/src/SchoolAdmission.Api/Controllers/HoldsController.cs` | `HoldAndAdmissionWorkflowTests.CancelHold_ShouldReleaseSeatImmediately` | **PASS** |
| **REQ-23** | `GET /me/holds`: List all application records for the requesting student. | `backend/src/SchoolAdmission.Api/Controllers/StudentController.cs` | Live API verification script: `curl -H "X-Student-Id: ..."` | **PASS** |
| **REQ-24** | Parent/Student UI: BRN identification, class listings, state-aware action buttons, live countdown card, payment, cancel, history. | `frontend/src/components/ClassList.tsx`<br>`frontend/src/components/ActiveHoldCard.tsx`<br>`frontend/src/components/student/StudentIdentificationCard.tsx` | End-to-end browser audit, simulated payment action, dynamic action states (`Apply`, `Continue`, `Confirmed`, `Admitted to Another`, `Already Active`, `No Seats`, `Apply Again`) | **PASS** |
| **REQ-25** | Admin UI: Overview metrics, class creation modal, capacity gauges, occupancy breakdowns. | `frontend/src/components/AdminDashboard.tsx` | UI audit, modal submission, dynamic update on seat reservations, shift filters, demo mode banner | **PASS** |
| **REQ-26** | Real-time countdown timer without page reload. | `frontend/src/components/CountdownTimer.tsx` | Vitest test: `CountdownTimer.test.tsx` (tests MM:SS rendering and zero-second callback) | **PASS** |
| **REQ-27** | Automated background seat polling (5-second refetch interval). | `frontend/src/components/ClassList.tsx` (`refetchInterval: 5000`) | TanStack Query config audit & network panel observation | **PASS** |
| **REQ-28** | Refresh resilience: Reloading or reopening page restores student session and active hold. | `frontend/src/context/StudentContext.tsx`<br>`frontend/src/api/client.ts` | `localStorage` BRN persistence, automated query on mount | **PASS** |
| **REQ-29** | Automated tests: Unit tests and high-concurrency race condition tests. | `backend/tests/` (32 tests)<br>`frontend/src/test/` (19 tests) | 19 Unit tests, 13 Integration tests, 19 Frontend tests — all 51 tests passing | **PASS** |
| **REQ-30** | Multi-class same-student concurrency protection (advisory locking). | `backend/src/SchoolAdmission.Infrastructure/Services/AdmissionService.cs` | `SeatAllocationConcurrencyTests.SameStudent_SimultaneousHoldRequestsAcrossDifferentClasses_ExactlyOneSucceeds` | **PASS** |
| **REQ-31** | Application data persistence across container restarts. | `docker-compose.yml` (named volume `pg_data`) | Verified via `docker compose down` followed by `docker compose up -d` | **PASS** |
| **REQ-32** | Required documentation (`README.md`, `ASSUMPTIONS.md`, `AI_USAGE.md`). | Repository root | Files created, audited, and verified against project reality | **PASS** |

---

## 2. Summary
- Total Requirements: **32**
- Verified Pass: **32 (100%)**
- Failures: **0**
- Unverified: **0**
