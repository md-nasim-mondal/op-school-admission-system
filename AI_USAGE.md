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

---

### 4. Verification & Validation Performed
Every line of code and test was verified through actual runtime execution:
- .NET 8 test suite executed: **32 tests passed (19 Unit tests + 13 Integration & Concurrency tests, 0 failed)**.
- React 19 frontend test suite executed: **6 Vitest tests passed (0 failed)**.
- Total automated tests: **38 tests passing (100% success rate)**.
- Frontend production bundle built successfully with Vite in 1.63s.
- Multi-stage Docker images built and orchestrated via Docker Compose.
