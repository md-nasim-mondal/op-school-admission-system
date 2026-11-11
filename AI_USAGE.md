# AI_USAGE.md
## Record of AI Tool Usage & Corrections

In accordance with the evaluation requirements of Onnorokom Projukti Limited, this document provides an honest and comprehensive account of AI tool assistance, areas of contribution, errors encountered, and human verification performed during this project.

---

### 1. AI Tools Utilized
- **Tool:** Google Antigravity Coding Assistant (Gemini 3.8 Flash)
- **Role:** Pair-programming copilot for architecture planning, boilerplate scaffolding, domain modeling, integration testing, and documentation authoring.

---

### 2. Areas of Assistance
1. **Requirements Extraction & Audit:**
   - Parsing the Bengali PDF assignment specification (`Asst_Software_Engineer_Project_Assignment.pdf`) and building a complete traceability matrix for all mandatory business rules, invariants, and API contracts.
2. **Architecture & Solution Scaffolding:**
   - Scaffolding the .NET 8 clean modular architecture (`SchoolAdmission.sln` with Domain, Application, Infrastructure, Api, and Test projects).
   - Scaffolding the React 19 + TypeScript + Vite + Tailwind CSS v4 frontend.
3. **Pessimistic Concurrency Strategy:**
   - Formulating PostgreSQL row-level locking (`SELECT FOR UPDATE`) within database transactions to ensure `HeldSeats + ConfirmedSeats <= TotalSeats` under high simultaneous traffic.
4. **Automated Testing Suite:**
   - Authoring unit tests for domain invariants, validation rules, and idempotency.
   - Authoring integration tests including the mandatory 100-request high-concurrency seat allocation test.
5. **Docker & Container Orchestration:**
   - Multi-stage Dockerfiles for .NET 8 ASP.NET Core API and React/Nginx SPA.
   - Root `docker-compose.yml` with health checks, persistent volumes, and environment wiring.

---

### 3. Meaningful Errors, Hallucinations & Critical Corrections

| Issue / Error Encountered | Cause | Detection Method | Resolution Applied |
|---|---|---|---|
| **Thread Pool Starvation in Concurrency Test** | AI initially used a synchronous `Barrier(100)` inside `Task.Run` to synchronize 100 simultaneous HTTP requests. | Test execution hung and timed out because 12 worker threads blocked on the barrier, preventing the remaining 88 tasks from being scheduled. | Replaced the blocking `Barrier` with a non-blocking asynchronous `TaskCompletionSource<bool>`. All 100 tasks await the token without consuming threads, firing simultaneously when signaled. |
| **xUnit Parallel Database Race Collisions** | AI did not disable parallelization across test classes sharing the PostgreSQL database. | Integration tests failed intermittently because `ResetDatabaseAsync` truncated tables while another test class was executing queries. | Configured `[assembly: CollectionBehavior(DisableTestParallelization = true)]` and grouped test classes under `[Collection("IntegrationTests")]` to guarantee strict sequential execution. |
| **Docker Desktop GPG Credential Store Error** | `~/.docker/config.json` contained `"credsStore": "desktop"`, which attempted to launch an interactive GUI PIN entry dialog in a headless terminal. | `docker pull` failed with `gpg: decryption failed: Operation cancelled`. | Inspected `~/.docker/config.json`, removed the desktop credsStore override, and configured standard authentication. |
| **TypeScript Strict Compilation Errors** | Unused imports and variables (`useEffect`, `CheckCircle`, Lucide props) and missing Vite environment types. | `npm run build` failed during strict `tsc -b` type checking. | Added `"types": ["vite/client"]` to `tsconfig.json` and cleaned up all unused imports across components. |
| **Host Port 5432 Collision** | Host machine had a preexisting system PostgreSQL service listening on port 5432. | `docker run` failed with `address already in use` when binding `5432:5432`. | Configured `docker-compose.yml` with `${DB_PORT:-5434}:5432` and internal container networking `db:5432`, preventing host port collision while keeping internal communication standard. |
| **Cross-Class Simultaneous Student Race Condition** | When simultaneous requests for the SAME student targeted DIFFERENT classes, class-level `SELECT FOR UPDATE` locks did not serialize requests across different classes, allowing two holds to be created for one student. | Authoring the cross-class concurrency test `SameStudent_SimultaneousHoldRequestsAcrossDifferentClasses_ExactlyOneSucceeds` revealed `[Created, Created]` instead of `[Created, Conflict]`. | Implemented PostgreSQL transaction-scoped advisory locks on the student ID: `SELECT pg_advisory_xact_lock(hashtext(@studentId))`, guaranteeing cross-class serialization at the database engine level. |
| **PostgreSQL Connection Pool Burst Exhaustion** | 100 simultaneous concurrent HTTP requests in integration testing exhausted PostgreSQL's default 100-connection client limit. | Concurrency test failed with `Npgsql.PostgresException: 53300: sorry, too many clients already`. | Increased PostgreSQL `max_connections` to 300 in `docker-compose.yml` and configured client pool connection settings in test harness. |
| **Hardcoded Default Student ID & Missing Student Switching Workflow** | Student ID defaulted to `20152691234567890` on initial load, occupying permanent header space with no identity switching or query cache flushing between multiple applicants on the same machine. | End-to-end UX review of running interface identified inability to switch students without stale data leaks or manual input editing. | Redesigned identity flow: anonymous landing card for new visitors, compact navbar badge with dedicated "Switch Student" confirmation dialog, automated `queryClient.clear()` on switch to guarantee cache isolation, and dynamic class action states (`Apply for Admission`, `Continue Application`, `Admission Confirmed`, `Already Admitted to Another Class`, `Application Already Active`, `No Seats Available`, `Apply Again`). |
| **Top-of-Page BRN Input Deviation & Demo Button Scope Creep** | AI relocated the BRN input solely into a landing card modal and added demo preset buttons ("Demo Student A/B"), diverging from the literal specification: *"Page-এর উপরে একটা ঘরে শিক্ষার্থীর জন্ম নিবন্ধন নম্বর লেখা যাবে।"* | Strict Phase 5 compliance audit against original Bengali assignment specification. | Restored the permanent 17-digit BRN input box directly in the header (`#top-brn-input`), removed demo shortcut buttons from production UI, added real-time validation indicator (`X/17` or `Valid`), and integrated seamless student switching with client cache purging. |
| **Swagger UI OpenAPI 3.0.4 Version Rejection** | Transitive upgrade via `Microsoft.AspNetCore.OpenApi` brought in `Microsoft.OpenApi 1.6.31`, causing the JSON endpoint to emit `"openapi": "3.0.4"`. Swashbuckle 6.6.2's bundled Swagger UI regex `^3\.0\.([0123])` only accepted patch versions 0 through 3, rendering *"Unable to render this definition. The provided definition does not specify a valid version field."* | Live browser inspection of `http://localhost:8080/swagger` and bundle regex analysis. | Replaced `Microsoft.AspNetCore.OpenApi` with explicit `<PackageReference Include="Microsoft.OpenApi" Version="1.6.14" />` (the exact version Swashbuckle targets), ensuring `"openapi": "3.0.1"` is emitted. |
| **Roslyn Performance & Allocation Warnings (CA1861 & CA1869)** | Passing inline constant arrays to CORS options allocated heap memory repeatedly (CA1861), and instantiating `new JsonSerializerOptions` on every handled exception discarded reflection/converter caches (CA1869). | Static code analysis review of `Program.cs` and `ExceptionHandlingMiddleware.cs`. | Extracted `DefaultAllowedOrigins` to a `static readonly string[]` field, and cached `JsonSerializerOptions` in a `private static readonly` instance in `ExceptionHandlingMiddleware`. |
| **C# 12 Primary Constructors & Source-Generated Regex** | Controllers, middleware, and domain exceptions used repetitive boilerplate constructor injection, and `StudentIdValidator` compiled regex at runtime via `RegexOptions.Compiled`. | C# 12 modernization audit against .NET 8 best practices. | Converted controllers and middleware to C# 12 primary constructors, simplified domain exceptions, upgraded `ClassEntity.Holds` to collection expression `[]`, and implemented `[GeneratedRegex]` compile-time source generation in `StudentIdValidator`. |

---

### 4. Verification & Validation Performed
Every line of code and test was verified through actual runtime execution:
- .NET 8 test suite executed: **32 tests passed (19 Unit tests + 13 Integration & Concurrency tests, 0 failed)**.
- React 19 frontend test suite executed: **17 Vitest tests passed (0 failed)** across component, identity workflow, and action state suites.
- Total automated tests: **49 tests passing (100% success rate)**.
- Full 5-journey end-to-end headless browser test suite executed via Chrome DevTools Protocol (`scratch_journey_test.py` passing 100%).
- Frontend production bundle built successfully with Vite in 1.93s.
- Multi-stage Docker images built and orchestrated via Docker Compose.
