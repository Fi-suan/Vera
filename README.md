
  # Design Artistic Frontend

  This is a code bundle for Design Artistic Frontend. The original project is available at https://www.figma.com/design/BkjsFzllrYmLcTPj6Lqndm/Design-Artistic-Frontend.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Backend MVP

  The VERA backend lives in `server/` and uses Express, Prisma, SQLite/PostgreSQL, Zod, deterministic mock AI extraction, and mock Iiko sync.

  ```bash
  npm install
  npx prisma generate
  npm run server:db:setup
  npm run server:seed
  npm run server:start
  ```

  The API starts on `http://localhost:4000`.

  API contract:

  - Swagger UI: `http://localhost:4000/api/docs`
  - OpenAPI JSON: `http://localhost:4000/api/openapi.json`

  Auth is email/password with JWT bearer tokens:

  ```bash
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"aigerim@vera.demo","password":"VeraDemo2026!"}'
  ```

  Use the returned token as `Authorization: Bearer <token>`.

  Demo accounts seeded by `npm run server:seed`:

  - `aigerim@vera.demo` / `VeraDemo2026!` — employee
  - `zarina@vera.demo` / `VeraDemo2026!` — reviewer
  - `admin@vera.demo` / `VeraDemo2026!` — admin

  For local-only debugging, `x-demo-user-id` can be enabled with `ALLOW_DEMO_HEADER=true`. Do not enable it in deployed environments.

  ### AI pipeline

  VERA supports two AI providers:

  - `AI_PROVIDER=mock` for deterministic local tests and safe demos.
  - `AI_PROVIDER=gemini` for real Gemini transcription and structured extraction.

  Gemini setup:

  ```bash
  AI_PROVIDER=gemini
  GEMINI_API_KEY=...
  GEMINI_MODEL=gemini-3.1-flash-lite
  ```

  Reviewer/admin users can verify the provider:

  ```bash
  curl -X POST http://localhost:4000/api/ai/test-provider \
    -H "Authorization: Bearer <token>"
  ```

  The extraction pipeline is:

  ```txt
  transcript/audio -> Gemini structured JSON -> Zod validation -> catalog reconciliation -> backend missingFields validation
  ```

  This keeps Gemini useful but not blindly trusted: product, trade point, employee, required fields, and deduction rules are still normalized by backend logic.

  ### Iiko integration mode

  VERA uses an adapter layer for Iiko:

  - `IIKO_ADAPTER=mock` keeps the demo safe and writes mock sync logs.
  - `IIKO_ADAPTER=real` enables real iikoCloud auth and connection checks.

  Copy `.env.example` and fill:

  ```bash
  IIKO_ADAPTER=real
  IIKO_BASE_URL=https://api-ru.iiko.services
  IIKO_API_LOGIN=...
  IIKO_ORGANIZATION_ID=...
  ```

  Reviewer/admin users can test credentials:

  ```bash
  curl -X POST http://localhost:4000/api/iiko/test-connection \
    -H "Authorization: Bearer <token>"
  ```

  Real stock mutation is intentionally guarded until the sponsor confirms the exact Iiko write-off document endpoint and sandbox organization. Until then, VERA prepares and logs Iiko-ready payloads without pretending that a real act was created.

  Useful checks:

  ```bash
  npm run server:test
  npm run build
  ```

  Frontend API contract lives in `docs/api-frontend.md`. Deploy notes live in `docs/deploy.md`. Local development uses `prisma/schema.prisma` with SQLite; shared public testing should use `prisma/postgres/schema.prisma` with PostgreSQL migrations.
  
