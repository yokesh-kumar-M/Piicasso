# PIIcasso — The 200X Upgrade Plan

> A phased roadmap for evolving PIIcasso toward a type-safe, observable,
> async-native platform using open-source tools.
>
> **Audience:** maintainers and coding agents executing the upgrade incrementally.
> **Scope:** Backend (Django/DRF) + Frontend (React/Vite). CLI and infra touched where they intersect.
> **Author of plan:** analysis pass, 2026-07-02.

> **Status note (2026-07-26):** this is an aspirational roadmap, not a release-status
> page. Several foundation items have since landed. Use [`README.md`](README.md) and
> the current source/configuration for supported behavior. No item in this plan is
> evidence that a hosted deployment is available or meets an uptime target.

---

## 0. How to use this document

This is an **execution spec**, not a wishlist. Rules for the executing agent:

1. **Work phase-by-phase, PR-by-PR.** Each phase lists concrete steps, exact file
   targets, the OSS tool to use, and a **Definition of Done (DoD)**. Do not start a
   phase until the previous phase's DoD is green, unless the dependency graph in
   §12 says it is parallelizable.
2. **Never break the invariants in §3.** They are the safety rails for a repository
   that handles PII. Verify external deployment state separately before operating it.
3. **Every PR must keep the current CI workflow green** (`.github/workflows/ci.yml`).
   Read that file rather than copying an outdated list of checks from this plan.
4. **One concern per PR.** A phase is many PRs. Keep them reviewable (<~600 LOC diff).
5. **Tests before refactors.** When a step says "refactor X," add characterization
   tests for X first, then refactor under green.
6. **Prefer incremental, reversible migrations** (strangler-fig) over big-bang rewrites.
   TypeScript, TanStack Query, and the service-layer split are all incremental.

Effort key: **S** = <0.5 day, **M** = 0.5–2 days, **L** = 3–5 days, **XL** = 1–2 weeks
(for a focused agent/developer).

---

## 1. Current-state assessment (honest scorecard)

This scorecard records the original July 2 baseline, not a certification that the
project or any deployment is production-grade. The progress notes below reflect
the repository as of July 26; remaining grades are prioritization aids, not audit results.

| Area                   | Grade  | Evidence                                                                                                                                                     | Gap to close                                                                                                                                                |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend security       | **A-** | CSP/HSTS/XFO middleware, field-level Fernet encryption, JWT w/ rotation+blacklist, throttles per-endpoint, recent CVE/Snyk hardening, XFF-aware client IP    | Tokens still bearer-in-localStorage (frontend side); no automated SAST (bandit/semgrep)                                                                     |
| Backend framework      | **A**  | Django 5.2.15 LTS, DRF 3.17, drf-spectacular, dj-database-url, whitenoise                                                                                    | Fine — keep on 5.2 LTS                                                                                                                                      |
| Async / real-time      | **C+** | Production starts Daphne/ASGI; Celery 5.4 and Channels 4.2 are installed                                                                                     | Wordlist generation still runs **synchronously** in the request; WebSocket workflow remains limited                                                         |
| AI / LLM               | **B-** | `google-genai` client, configurable `GEMINI_MODEL`, structured JSON response schema, offline fallback + scoring                                              | Single provider; no prompt eval suite or local-model path                                                                                                   |
| Data layer             | **B-** | Postgres in prod, Fernet-encrypted PII, retention purge command                                                                                              | `db.sqlite3` **committed to git**; no pgvector/search; dev uses SQLite (parity drift)                                                                       |
| Backend code quality   | **B-** | Readable, documented                                                                                                                                         | `views/generation.py` = **957 LOC**; no type hints/mypy; no service layer; `intelligence/` app (177 LOC) **not in `INSTALLED_APPS`** (dead code)            |
| Backend tests          | **B**  | ~70 Django tests, Postgres in CI                                                                                                                             | Uses `unittest`/Django `TestCase` not pytest; no coverage gate; no property/mutation tests                                                                  |
| Frontend framework     | **B+** | Node 24, React 19.2, Vite 8, Tailwind 4, Radix + CVA + tailwind-merge                                                                                        | Modern dependencies; TypeScript migration remains open                                                                                                      |
| Frontend language      | **D**  | 100% JavaScript, **JSX-in-`.js`** via esbuild shim, CRA-era `process.env.REACT_APP_*` via `define`                                                           | **No TypeScript.** Biggest single lever.                                                                                                                    |
| Frontend architecture  | **C**  | Context + manual axios interceptor                                                                                                                           | **No server-state lib** (no TanStack Query); monster components (`ProfilePage.js` 1365, `LandingPage.js` 979, `ApiDocsPage.js` 817); auth logic hand-rolled |
| Frontend auth security | **C-** | Refresh rotation, 30s skew buffer                                                                                                                            | **Both access + refresh JWT in `localStorage`** → XSS-exfiltratable on a PII product                                                                        |
| Frontend tests         | **C-** | Vitest/Testing Library coverage now includes auth refresh and truthful system-log states                                                                     | No broad integration, E2E, or coverage gate                                                                                                                 |
| Dev experience         | **B**  | Ruff, seed-strict mypy, pre-commit, gitleaks, ESLint, Prettier, EditorConfig, and Taskfile are configured                                                    | No devcontainer; type coverage and frontend warning cleanup remain incremental                                                                              |
| CI/CD                  | **B+** | Backend/frontend/CLI tests, schema drift, Ruff/mypy, gitleaks, npm audits, and production image builds                                                       | No CodeQL/semgrep/trivy, coverage gate, preview environments, or E2E                                                                                        |
| Observability          | **B-** | Prometheus middleware, Sentry, Grafana Cloud, Better Stack                                                                                                   | Text logs (not structured JSON), no distributed tracing (OpenTelemetry)                                                                                     |
| Docs                   | **B**  | Root and Node CLI READMEs describe Node 24, Vite 8, current CLI contracts, and both Compose topologies                                                       | Keep secondary/historical documents synchronized as behavior changes                                                                                        |
| Repo hygiene           | **A-** | Generated databases/logs are untracked; EditorConfig, touched-file line-ending checks, a full whitespace gate, ignore policy, and secret scanning are active | Keep generated-artifact checks current as new toolchains are added                                                                                          |
| Code sharing (engine)  | **C**  | Same PII engine in 3 places                                                                                                                                  | Triplicated by hand: `frontend/src/lib/piiEngine.js`, `cli-node/.../pii.js`, `cli-python/.../pii.py`                                                        |

**Verdict:** a B-grade codebase with A-grade security ambition. The upgrade turns
every C/D into an A by adding the modern OSS layer the project skipped.

---

## 2. Target architecture (the "200X" vision)

```
                         ┌─────────────────────────────────────────┐
                         │  TYPE-SAFE CONTRACT (OpenAPI 3.1)         │
                         │  drf-spectacular ⇄ openapi-typescript     │
                         │  one schema → generated TS client + tests │
                         └───────────────┬─────────────────────────┘
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                 ▼                                 ▼
┌───────────────┐              ┌─────────────────────┐            ┌──────────────────┐
│  Frontend     │              │  Backend API tier   │            │  CLI (npm/pip)   │
│  React 19 +TS │  TanStack    │  Django 5.2 LTS     │            │  shares engine   │
│  Vite + shadcn│◀──Query────▶ │  DRF + django-ninja │            │  via parity suite│
│  Zustand      │  openapi-    │  (async endpoints)  │            └──────────────────┘
│  RHF + Zod    │  fetch       │  Pydantic I/O       │
│  Playwright   │              └──────────┬──────────┘
└───────────────┘                         │
   httpOnly cookie auth                   ├──▶ Celery workers (Redis broker) ──▶ Flower
   (no token in JS)                       │      • async Gemini generation
                                          │      • Celery Beat: retention purge
                                          ├──▶ Channels/daphne WS ──▶ live gen progress
                                          ├──▶ LiteLLM router ──▶ Gemini | Ollama(local, PII-safe)
                                          │      structured output (Pydantic), promptfoo evals
                                          ├──▶ Postgres + pgvector (semantic dedup/search)
                                          ├──▶ MinIO/S3 (dossier PDFs)
                                          └──▶ OpenTelemetry ──▶ Grafana (Tempo/Loki/Mimir)
                                               structlog JSON logs · Prometheus · Sentry
```

**Guiding tenets:** contract-first, type-safe end-to-end, async by default for slow
work, observable by default, tested at every layer, and privacy-preserving AI
(PII can stay on-box via a local model path).

---

## 3. Invariants — DO NOT BREAK

These are non-negotiable safety rails. A change that violates one must be reverted.

1. **PII stays encrypted at rest.** `generator.fields.EncryptedJSONField` (Fernet via
   `FIELD_ENCRYPTION_KEY`) must keep wrapping `pii_data`. Never log or Sentry-ship raw PII
   (`send_default_pii=False` stays False).
2. **Contract-tested engine behavior.** The browser, Node, and Python engines are
   independent ports; do not claim byte-identical output without shared golden fixtures.
   Any behavior intended to match across surfaces must ship with the parity suite (§13) green.
3. **Auth contract stability.** JWT access/refresh endpoints and Google OAuth flow keep
   working through the cookie migration (dual-read during transition).
4. **Security headers stay on** — CSP/HSTS/XFO/referrer-policy middleware in `wordgen/middleware.py`.
5. **Throttle & lockout semantics preserved** — the per-endpoint rates in
   `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]` and `AccountLockoutMiddleware`.
6. **No secret in git.** Ever. (And remove the ones already there — §4.)
7. **Migrations always reversible & `makemigrations --check` clean** (CI enforces).
8. **API stays backward-compatible** within `v1.0` (`AcceptHeaderVersioning`). Breaking
   changes go to `v2`.

---

## 4. Phase 0 — Foundations & Developer Experience `[XL, do first]`

**Goal:** make the repo fast, safe, and pleasant to change so every later phase moves
faster. Nothing here changes runtime behavior.

### 4.1 Repo hygiene `[S]`

- Remove tracked artifacts and stop tracking them:
  `git rm --cached Piicasso/backend/db.sqlite3 Piicasso/backend/*.log Piicasso/backend/server*.log Piicasso/backend/error.log`
- Extend `.gitignore`: `*.sqlite3`, `*.log`, `.venv/`, `staticfiles/`, `media/`, `.ruff_cache/`, `.mypy_cache/`, `htmlcov/`, `coverage.xml`, `dist/`, `.turbo/`.
- Delete or wire in the **dead `intelligence/` app**: it is not in `INSTALLED_APPS`.
  Decide: (a) delete it, or (b) add it and use its models. Default: **delete** unless a
  Phase-4 search feature will use it.
- **DoD:** `git status` clean; `git ls-files | grep -E 'sqlite3|\.log$'` empty.

### 4.2 Backend tooling — replace flake8 with the modern stack `[M]`

- Add `Piicasso/backend/pyproject.toml` as the single source for tool config.
- **[Ruff](https://github.com/astral-sh/ruff)** — replaces flake8 + isort + (mostly) black.
  Enable `E,F,I,UP,B,S,DJ,C4,SIM,PTH,RUF` rule sets (`S`=bandit-style security, `DJ`=Django).
  `ruff format` for formatting.
- **[mypy](https://github.com/python/mypy)** + **[django-stubs](https://github.com/typeddjango/django-stubs)** +
  **[djangorestframework-stubs](https://github.com/typeddjango/djangorestframework-stubs)** — start `strict = false`, ratchet up per-module.
- **[uv](https://github.com/astral-sh/uv)** — fast, reproducible installs + lockfile
  (`uv pip compile requirements.in -o requirements.txt`). Keep `requirements.txt` as the
  compiled artifact so Render/Docker are unaffected; add `requirements.in` as the source of truth.
- **DoD:** `ruff check .` and `ruff format --check .` pass; `mypy wordgen/utils.py wordgen/throttles.py` clean (seed modules); CI runs Ruff instead of the narrow flake8 select.

### 4.3 Frontend tooling `[M]`

- **[ESLint 9 flat config](https://eslint.org/)** + `typescript-eslint`,
  `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`,
  `eslint-plugin-import`.
- **[Prettier](https://prettier.io/)** + `prettier-plugin-tailwindcss` (auto-sorts Tailwind classes).
- Add `lint`, `format`, `typecheck` scripts to `package.json`.
- **DoD:** `npm run lint` and `npm run format:check` pass on the (formatted) tree.

### 4.4 Cross-cutting DX `[M]`

- **[pre-commit](https://pre-commit.com/)** at repo root: ruff, ruff-format, mypy (fast
  files), prettier, eslint, end-of-file-fixer, trailing-whitespace,
  **[gitleaks](https://github.com/gitleaks/gitleaks)** (secret scan),
  `check-added-large-files`.
- **[Taskfile](https://taskfile.dev/)** (or `Makefile`) at root: `task setup`, `task dev`,
  `task test`, `task lint`, `task typecheck`, `task up` (compose).
- **`.editorconfig`** + a **`.devcontainer/`** (Python 3.12 + Node 24 + Postgres + Redis)
  so the environment is one-command reproducible.
- **[Renovate](https://github.com/renovatebot/renovate)** to augment/replace Dependabot
  (grouped PRs, automerge for patch/dev-deps, lockfile maintenance).
- **DoD:** fresh clone → `task setup && task test` works; pre-commit blocks a planted secret.

---

## 5. Phase 1 — Backend contract & type-safety `[L]`

**Goal:** make the API a typed, verified contract that the frontend and CLI consume
mechanically, and tame the monolithic views.

### 5.1 Harden the OpenAPI contract `[M]`

- **Landed foundation:** `schema.yml` is committed, warning-free, and checked for
  drift in CI. The submit schema documents recognized profile fields,
  `pattern_mode`, and the typed `201` response envelope.
- PII submission now rejects undeclared JSON keys and profile values longer than
  256 characters; OpenAPI marks the request object as closed.
- Maintain the existing schema drift gate: regenerate with
  `python manage.py spectacular --file schema.yml --validate` and diff against the
  committed `schema.yml` in CI.
- Annotate views with `@extend_schema` (request/response serializers, error shapes) so the
  generated client is precise. Priority: `wordgen/views/generation.py`, `operations/views.py`, `password_security/views.py`.
- **DoD:** `spectacular --validate` clean, zero warnings; committed `schema.yml` matches.

### 5.2 Service-layer refactor of the 957-LOC view `[L]`

- Extract business logic from `wordgen/views/generation.py` into `wordgen/services/`
  (there's already a `services/` package with `metrics_service.py`):
  - `services/generation_service.py` — orchestration (build prompt → call LLM → score → persist).
  - `services/scoring_service.py` — move `score_wordlist` + helpers out of `llm_handler.py`.
  - `llm_handler.py` becomes a thin provider adapter (Phase 3 replaces its guts).
  - Views become thin: validate (serializer) → call service → serialize response.
- Add **type hints** to every extracted function; run mypy on `wordgen/services/**`.
- Characterization tests first (capture current outputs), then refactor under green.
- **DoD:** `generation.py` < ~300 LOC; services fully typed + unit-tested; behavior identical.

### 5.3 Pydantic at the boundaries `[M]`

- Use **[Pydantic v2](https://docs.pydantic.dev/)** models for LLM request/response and for
  the PII profile schema (validation + coercion + JSON schema for the LLM structured-output call in Phase 3).
- Optionally introduce **[django-ninja](https://django-ninja.dev/)** for _new_ endpoints
  (async-native, Pydantic-native) — mount alongside DRF, do not rip out DRF. Good target:
  a new `/api/v2/generate/` async endpoint in Phase 2.
- **DoD:** PII profile has a single Pydantic schema reused by API validation, the LLM prompt builder, and tests.

---

## 6. Phase 2 — Async & real-time (the scale lever) `[L]`

**Goal:** stop doing slow work (Gemini calls, PDF generation) inside the request. Use the
Celery + Channels stack that is **already installed but idle**.

### 6.1 Move generation to Celery `[L]`

- Turn `PiiSubmitView` into: create a `GenerationHistory` row in `PENDING`, dispatch a
  Celery task, return `202 Accepted` + a `task_id`/`job_id`.
- Implement `wordgen/tasks.py::generate_wordlist_task` (file exists) to run build→LLM→score→persist
  and flip status to `DONE`/`FAILED`.
- Add `GET /api/generation/<id>/status/` for polling fallback.
- Keep a **synchronous fast-path** for the offline algorithmic fallback so small requests stay instant.
- **DoD:** a submitted generation runs off-request; status transitions observable; the existing sync test path still passes (eager mode already configured for tests).

### 6.2 Live progress over WebSockets `[M]`

- Use the existing `wordgen/consumers.py` + `channels_redis` (already configured for prod)
  to push `queued → generating → scoring → done` events keyed by `job_id`.
- Auth the socket with the existing `wordgen/ws_auth.py` JWT check.
- Frontend consumes it in the new operation flow (Phase 8).
- **DoD:** submitting a job streams progress to the browser; falls back to polling if WS unavailable.

### 6.3 Scheduled jobs via Celery Beat `[S]`

- Move `management/commands/purge_expired_data.py` to a **Celery Beat** periodic task
  (respect `DATA_RETENTION_DAYS`). Keep the management command as a manual escape hatch.
- **DoD:** retention purge runs on schedule in a worker; documented in `start-celery.sh`.

### 6.4 Operational visibility `[S]`

- Add **[Flower](https://github.com/mher/flower)** (Celery monitoring) as a compose service,
  auth-gated. Add a `celery-worker` + `celery-beat` + `flower` service to `docker-compose.yml`.
- **DoD:** Flower shows task throughput/failures locally.

---

## 7. Phase 3 — AI/LLM modernization (AI-native) `[L]`

**Goal:** evolve the now-structured Gemini integration into a provider-agnostic,
evaluated, and privacy-preserving LLM layer.

### 7.1 Provider abstraction + structured output `[M]`

- **Landed foundation:** `llm_handler.py` uses the supported `google-genai` SDK,
  selects the model with `GEMINI_MODEL`, requests a validated structured response,
  and preserves a tested deterministic fallback.
- Add a provider boundary, for example **[LiteLLM](https://github.com/BerriAI/litellm)**,
  if multi-provider routing is required. Do not add abstraction solely for a marketing claim.
- Preserve the structured response validation and fallback tests through any provider change.
- **DoD:** provider selection is explicit and tested; malformed output cannot corrupt the
  wordlist; timeout and fallback behavior remain deterministic.

### 7.2 Privacy-preserving local model path `[M]`

- Add an **[Ollama](https://github.com/ollama/ollama)** provider option (via LiteLLM) so a
  self-hosted deployment can keep **PII fully on-box** — a natural fit for a PII product and a
  strong differentiator. Gate by `LLM_PROVIDER=ollama`.
- **DoD:** with Ollama running, a generation completes with zero external network egress
  (verify via egress logging/CSP).

### 7.3 Prompt management + evals `[M]`

- Externalize prompts from `build_prompt` string-concatenation into versioned templates.
- Add **[promptfoo](https://github.com/promptfoo/promptfoo)** (or
  **[DeepEval](https://github.com/confident-ai/deepeval)**) eval suite: golden PII profiles →
  assert wordlist quality/coverage/no-hallucinated-instructions, run in CI (nightly, not per-PR).
- **DoD:** `promptfoo eval` runs against fixtures; a prompt regression fails the nightly job.

### 7.4 (Optional, stretch) Semantic features `[L]`

- With **pgvector** (Phase 4), embed generated candidates to **de-duplicate near-identical
  passwords** and to power "similar past operations" — real intelligence, not just concatenation.
- **DoD:** dedup measurably shrinks near-duplicate output; opt-in flag.

---

## 8. Phase 4 — Data layer & storage `[M]`

**Goal:** production-parity data layer, real search, and durable artifact storage.

- **Dev/prod parity:** stop defaulting dev to SQLite. Ship a Postgres 15 + Redis 7
  `docker-compose` dev stack (compose already exists — make it the documented default).
  Remove `db.sqlite3` from the repo (Phase 0).
- **[pgvector](https://github.com/pgvector/pgvector)** extension + a migration adding embedding
  columns (enables §7.4 and semantic history search).
- **Search:** for operation/breach history, either Postgres FTS (`SearchVector`/GIN) for zero
  new infra, or **[Meilisearch](https://github.com/meilisearch/meilisearch)** /
  **[Typesense](https://github.com/typesense/typesense)** for instant typo-tolerant search if UX warrants.
- **Artifact storage:** move dossier PDFs (`wordgen/report_generator.py`, ReportLab) off local
  `MEDIA_ROOT` to **[MinIO](https://github.com/minio/minio)** (S3-compatible) via
  `django-storages` + `boto3`. Presigned URLs for download.
- **Indexes & constraints:** audit `GenerationHistory`, `PasswordAnalysis`, `operations` models
  for missing DB indexes on filter/order fields (`user`, `created_at`, status) and add them.
- **DoD:** `python manage.py migrate` clean on Postgres; PDFs served from object storage via
  presigned URL; history search returns in <100ms on 10k rows.

---

## 9. Phase 5 — Frontend architecture overhaul `[XL]`

**Goal:** type-safe, server-state-correct, componentized, tested frontend. This is where the
user-visible "200X" lands.

### 9.1 TypeScript migration (incremental strangler-fig) `[XL]`

- Add `tsconfig.json` (`strict: true`, `allowJs: true`, `checkJs: false`), `vite-tsconfig-paths`.
- Rename **JSX-in-`.js`** files to `.tsx`/`.ts` incrementally; remove the esbuild `.js`-as-JSX
  shim from `vite.config.js` as files migrate. Start with leaf utilities and the API layer, end with pages.
- Fix the CRA-ism while here: migrate `process.env.REACT_APP_*` → `import.meta.env.VITE_*`
  (update Vercel env var names once; keep a temporary alias in `define` during transition).
- Order: `lib/`, `api/`, `hooks/`, `context/` → `components/` → `pages/` (biggest last).
- **DoD:** `npm run typecheck` (`tsc --noEmit`) passes; no remaining `.js` files containing JSX.

### 9.2 Server state → TanStack Query `[L]`

- Add **[TanStack Query](https://github.com/TanStack/query)**. Replace hand-rolled
  `useEffect`+axios data fetching with typed `useQuery`/`useMutation` hooks (caching,
  dedup, retries, background refetch, optimistic updates for free).
- Wire the axios refresh interceptor into Query's error handling; keep the single axios instance.
- Priority pages: `AnalysisHistoryPage`, `SavedPage`, `InboxPage`, `SuperAdminPage`, `FinancialRiskPage`, `DarkWebPage`.
- **DoD:** no page fetches server data via bare `useEffect`+`setState`; polling (notifications, beacon) uses Query's `refetchInterval`.

### 9.3 Typed API client from OpenAPI `[M]`

- Generate a fully typed client from the Phase-1 `schema.yml` with
  **[openapi-typescript](https://github.com/openapi-ts/openapi-typescript)** +
  **[openapi-fetch](https://github.com/openapi-ts/openapi-typescript)** (or
  **[Orval](https://github.com/anymaniax/orval)** to emit ready-made TanStack Query hooks).
- Regeneration wired into CI so frontend types can't drift from the backend contract.
- **DoD:** endpoints are called through generated, typed functions; a backend field rename breaks the frontend build (good).

### 9.4 Client state → Zustand `[M]`

- Replace sprawling Context (`AuthContext`, `ModeContext`) responsibilities that are pure
  client state (mode/theme, UI flags) with **[Zustand](https://github.com/pmndrs/zustand)**
  stores. Keep Context only for true DI (the auth session object).
- **DoD:** mode/theme and transient UI state live in Zustand; fewer re-renders (verify with React DevTools Profiler).

### 9.5 Break up the monster components `[L]`

- Decompose by feature into `features/<domain>/` (components + hooks + api + types co-located):
  - `ProfilePage.js` **1365 LOC** → `features/profile/*` (account, security, sessions, preferences).
  - `LandingPage.js` **979** → section components under `features/marketing/`.
  - `ApiDocsPage.js` **817**, `SuperAdminPage.js` **664**, `SavedPage.js` **499**, `ResultPage.js` **459**, `TeamsPage.js` **468** similarly.
- **DoD:** no component file > ~300 LOC; shared UI in a `components/ui/` primitives layer.

### 9.6 Forms, design system, a11y `[M]`

- **[react-hook-form](https://github.com/react-hook-form/react-hook-form)** +
  **[Zod](https://github.com/colinhacks/zod)** for all forms (login, register, operation,
  profile) — replaces manual validation in `utils/validation.js`; share Zod schemas with the API types.
- Formalize the design system on **[shadcn/ui](https://ui.shadcn.com/)** — the project already
  has its building blocks (`@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`,
  `components.json`). Generate the `components/ui/` primitives properly.
- **[Storybook](https://github.com/storybookjs/storybook)** for the primitives + key
  components (visual review, a11y addon, interaction tests).
- **DoD:** forms are RHF+Zod; `eslint-plugin-jsx-a11y` clean; Storybook builds with the core components.

### 9.7 Auth security fix — get JWTs out of `localStorage` `[L]` **(security-critical)**

- Move refresh tokens to **httpOnly, Secure, SameSite cookies** set by the backend; keep the
  short-lived access token **in memory only** (React state), refreshed silently via the cookie.
- This closes the XSS-token-exfiltration hole (`AuthContext.js` currently stores both tokens in
  `localStorage`) — important for a PII platform.
- Coordinate with backend: add cookie-setting on `/token/` + `/token/refresh/`, CSRF protection
  for the cookie path, dual-read during rollout.
- **DoD:** no JWT in `localStorage`/`sessionStorage`; refresh works via cookie; logout clears the cookie server-side.

---

## 10. Phase 6 — Testing & quality gates `[L]`

**Goal:** a real test pyramid with enforced coverage, so future changes are safe.

### Backend

- Migrate to **[pytest](https://docs.pytest.org/)** + **[pytest-django](https://github.com/pytest-dev/pytest-django)**;
  add **[factory_boy](https://github.com/FactoryBoy/factory_boy)** + **[Faker](https://github.com/joke2k/faker)**.
- **[coverage.py](https://github.com/nedbat/coveragepy)** gate (start at current %, ratchet +2%/PR to 85%).
- **[Hypothesis](https://github.com/HypothesisWorks/hypothesis)** property tests for the PII
  engine + scoring (`score_wordlist` invariants: 1–100 bounds, monotonic PII overlap).
- **[Schemathesis](https://github.com/schemathesis/schemathesis)** — fuzz the API against the OpenAPI schema.
- (Stretch) **[mutmut](https://github.com/boxed/mutmut)** mutation testing on the engine/scoring core.

### Frontend

- **Vitest** coverage gate; component tests with **React Testing Library**.
- **[MSW](https://github.com/mswjs/msw)** to mock the API in component/integration tests
  (reuse the OpenAPI types).

### End-to-end

- **[Playwright](https://github.com/microsoft/playwright)** across the three surfaces: web app
  critical flows (register → login → operation → result), the in-browser `/terminal`, and mobile viewport.

### Load & security

- **[k6](https://github.com/grafana/k6)** (or **[Locust](https://github.com/locustio/locust)**)
  load test for `/api/submit/` and history endpoints.
- Add to CI: **[bandit](https://github.com/PyCQA/bandit)** (or Ruff `S`),
  **[semgrep](https://github.com/semgrep/semgrep)**, **[Trivy](https://github.com/aquasecurity/trivy)**
  (container + fs scan), **[CodeQL](https://codeql.github.com/)**, `gitleaks`.
- **DoD:** coverage gate enforced both stacks; Playwright smoke suite green in CI; semgrep/trivy/CodeQL run on PRs.

---

## 11. Phase 7 — Observability & Ops `[M]`

**Goal:** see everything, in structured form, with traces that cross the async boundary.

- **[OpenTelemetry](https://opentelemetry.io/)** (`opentelemetry-instrumentation-django`,
  `-celery`, `-redis`, `-psycopg2`, `-requests`) → export to **Grafana Tempo** (traces).
  Trace a request across the Celery task boundary (Phase 2).
- **Structured logging:** replace the text formatter with JSON via
  **[structlog](https://github.com/hynek/structlog)** (or `python-json-logger`); attach the
  existing `RequestIDMiddleware` correlation id to every log line and span. Ship to **Grafana Loki**.
- **Metrics:** Prometheus middleware already present; add app-level metrics
  (generation latency, LLM fallback rate, queue depth) via the existing `metrics_service.py`; ship **Grafana dashboards as code** (JSON in `Piicasso/backend/observability/`).
- **Health:** add **[django-health-check](https://github.com/revsys/django-health-check)**
  (DB, Redis, cache, Celery) behind `/api/health/` (there's already a health endpoint to extend).
- **Frontend:** wire Sentry browser SDK + **source maps upload** in CI for readable stack traces;
  add web-vitals reporting.
- **DoD:** one trace shows HTTP → Celery → LLM → DB spans; logs are JSON with request id; a Grafana dashboard renders generation latency + fallback rate.

---

## 12. Phase 8 — Infra, CI/CD, deployment `[M]`

**Goal:** hardened images, fast/comprehensive pipelines, safe releases.

- **Docker:** multi-stage build; non-root user; pinned digest base or
  **[Chainguard/distroless](https://github.com/GoogleContainerTools/distroless)**; `HEALTHCHECK`;
  generate **SBOM** with **[Syft](https://github.com/anchore/syft)** and (optionally) sign with
  **[cosign](https://github.com/sigstore/cosign)**. Scan with Trivy in CI.
- **CI upgrades:** parallelize jobs; cache aggressively (already partially done); add coverage
  upload, Playwright job, semgrep/CodeQL/trivy/gitleaks; make them **required checks**; add
  **[actions/dependency-review](https://github.com/actions/dependency-review-action)**.
- **Preview environments:** Vercel already gives frontend previews; add ephemeral backend
  previews (Render preview envs or a Fly.io per-PR app) so E2E runs against a real stack.
- **Release safety:** tag + changelog automation
  (**[release-please](https://github.com/googleapis/release-please)** or
  **[semantic-release](https://github.com/semantic-release/semantic-release)**), Sentry release
  tagging (`SENTRY_RELEASE` is already read in settings).
- **Secrets:** move real secrets to a manager — **[Infisical](https://github.com/Infisical/infisical)**
  (OSS) or Doppler — and complete the rotation runbook already started in `SECURITY_REMEDIATION.md`.
- **DoD:** image is non-root + scanned + SBOM'd; PRs get a full-stack preview + E2E; releases are tagged with changelog and Sentry release.

---

## 13. Phase 9 — Engine unification (kill the triplication) `[L]`

**Goal:** one source of truth for the PII engine instead of three hand-synced copies
(`frontend/src/lib/piiEngine.js`, `cli-node/src/engine/pii.js`, `cli-python/.../pii.py`).

- **Monorepo tooling:** the repo already has `pnpm-workspace.yaml`. Adopt **pnpm workspaces**
  - **[Turborepo](https://github.com/vercel/turborepo)** (or **[Nx](https://github.com/nrwl/nx)**).
- **Single TS engine package** `packages/pii-engine` consumed by both the frontend and
  `cli-node` (delete their local copies).
- **Python parity by contract:** keep the Python port, but drive both from **shared JSON golden
  fixtures** (`packages/pii-engine/fixtures/*.json`) — a parity test in each language asserts
  identical output. This operationalizes invariant §3.2 so parity can't silently break.
- **DoD:** frontend + cli-node import the shared package; a fixture-driven parity suite runs in
  CI for all three implementations; a deliberate divergence fails CI.

---

## 14. Sequencing & dependency graph

```
Phase 0 (DX/hygiene) ─┬─▶ Phase 1 (contract/types) ─┬─▶ Phase 2 (async) ─┬─▶ Phase 3 (AI)
                      │                              │                    └─▶ Phase 4 (data) ─▶ 3.4 semantic
                      │                              └─▶ Phase 5.3 (typed client needs schema.yml)
                      └─▶ Phase 5 (frontend TS) ─────────▶ Phase 5.2 Query ─▶ 5.7 cookie-auth (needs backend coord)
Phase 6 (testing) ── runs continuously, gated after Phase 0
Phase 7 (observability) ── after Phase 2 (needs async boundary to trace)
Phase 8 (infra/CI) ── incremental, after Phase 0; E2E after Phase 6
Phase 9 (engine) ── independent; do any time after Phase 0
```

**Recommended order:** 0 → (1 ‖ 5.1 TS-setup) → (2 ‖ 5.2/5.3) → 3 → 4 → 6 (deepen) → 7 → 8 → 9.
Phases 6 and 8 are partly continuous (gates added as capabilities land).

---

## 15. Quick wins — the first week (highest value / lowest risk)

Ship these as the first small PRs to build momentum and safety before the big refactors:

1. **Landed:** repo hygiene (§4.1) — runtime databases/logs are untracked and ignored, with cross-platform line-ending policy enforced on touched files. `[S]`
2. **Landed:** Ruff + pre-commit + gitleaks (§4.2/4.4) provide lint, format, and secret-scan gates. `[S–M]`
3. **Keep docs current** — the root and Node CLI READMEs are updated; audit secondary documents such as `piicasso.md`. `[S]`
4. **Delete the dead `intelligence/` app** (or wire it in). `[S]`
5. **Landed:** OpenAPI contract follow-through (§5.1) — warning-free drift checks and explicit unknown-key rejection are tested. `[S]`
6. **Add coverage reporting** (not yet a hard gate) to see the baseline. `[S]`
7. **Landed:** LLM structured-output fix (§7.1, minimal slice) — the Gemini adapter validates a typed JSON response and falls back deterministically. `[M]`

---

## 16. Risk register

| Risk                                                      | Likelihood | Impact | Mitigation                                                                              |
| --------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------- |
| TS migration stalls mid-way (mixed `.js`/`.tsx`)          | Med        | Med    | Strangler-fig with `allowJs`; migrate leaf→page; each PR fully green                    |
| Cookie-auth migration locks users out                     | Low        | High   | Dual-read (cookie _or_ bearer) during rollout; feature-flag; staged deploy              |
| Celery/async introduces race in status transitions        | Med        | Med    | Idempotent tasks; DB row is source of truth; eager mode in tests                        |
| LLM provider swap changes wordlist output                 | Med        | Low    | Golden-fixture tests; keep deterministic fallback; promptfoo evals                      |
| Engine unification breaks intended cross-surface behavior | Med        | High   | Shared JSON fixtures + parity CI (invariant §3.2) before deleting copies                |
| Secret already in git history                             | High       | High   | Rotate keys (runbook exists in `SECURITY_REMEDIATION.md`); `git filter-repo` + gitleaks |
| Scope creep ("200X" = infinite)                           | High       | Med    | Phase DoDs + quick-wins first; each phase independently shippable/valuable              |

---

## 17. Definition of Done — per phase (checklist)

- **P0 Foundations:** clean repo; Ruff+mypy+pre-commit+gitleaks green; Taskfile + devcontainer; Renovate on.
- **P1 Contract:** `schema.yml` committed + drift-gated; `generation.py` < 300 LOC with typed service layer; Pydantic PII schema.
- **P2 Async:** generation runs in Celery with WS progress + polling fallback; Beat purge; Flower.
- **P3 AI:** provider-agnostic (LiteLLM), structured JSON output, Ollama local path, promptfoo evals in nightly CI.
- **P4 Data:** Postgres-parity dev; pgvector; object-storage PDFs; indexed hot paths; fast history search.
- **P5 Frontend:** 100% TS (no JSX-in-`.js`); TanStack Query for all server state; generated typed client; Zustand client state; no component > 300 LOC; RHF+Zod forms; **no JWT in localStorage**.
- **P6 Testing:** pytest+coverage gate; Hypothesis+Schemathesis; Vitest+MSW; Playwright E2E; semgrep/trivy/CodeQL/gitleaks in CI.
- **P7 Observability:** OTel traces across async boundary; structlog JSON logs w/ request id; Grafana dashboards-as-code; health checks; frontend source maps.
- **P8 Infra:** non-root scanned SBOM'd image; required CI checks + previews + E2E; release automation; secrets manager.
- **P9 Engine:** one shared TS engine + fixture-driven parity suite for all three surfaces.

---

## 18. Appendix — open-source tool inventory (by layer)

| Layer                      | Tools                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Python quality**         | Ruff, mypy, django-stubs, drf-stubs, uv, pre-commit, bandit, semgrep                                                                             |
| **Python test**            | pytest, pytest-django, factory_boy, Faker, coverage.py, Hypothesis, Schemathesis, mutmut, k6/Locust                                              |
| **Backend runtime (new)**  | LiteLLM, google-genai, Pydantic v2, django-ninja, Ollama, pgvector, django-storages+MinIO, Flower, django-health-check, structlog, OpenTelemetry |
| **JS/TS quality**          | TypeScript, ESLint 9 (typescript-eslint, react, react-hooks, jsx-a11y, import), Prettier(+tailwind), Husky/lint-staged                           |
| **Frontend runtime (new)** | TanStack Query, Zustand, react-hook-form, Zod, shadcn/ui, openapi-typescript/openapi-fetch (or Orval)                                            |
| **Frontend test**          | Vitest, React Testing Library, MSW, Playwright, Storybook(+a11y/interactions)                                                                    |
| **Monorepo/engine**        | pnpm workspaces, Turborepo (or Nx)                                                                                                               |
| **Observability**          | OpenTelemetry, Grafana Tempo/Loki/Mimir, Prometheus, structlog, Sentry                                                                           |
| **CI/CD & supply chain**   | GitHub Actions, CodeQL, Trivy, Syft, cosign, gitleaks, dependency-review, Renovate, release-please/semantic-release                              |
| **Secrets/infra**          | Infisical (OSS) or Doppler; devcontainers; docker compose (Postgres/Redis/MinIO/Flower)                                                          |
| **AI evals**               | promptfoo, DeepEval                                                                                                                              |

---

_This plan is intentionally phased and reversible. Each phase delivers standalone value; you can
stop after any phase and still have shipped a real upgrade. Start with §15 (Quick wins), then
execute §14's recommended order._
