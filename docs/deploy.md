# VERA Deploy Notes

Default hackathon deployment is one Node service:

- frontend: built Vite assets served from `dist`
- backend: Node/Express API under `/api`

For local backend development we keep SQLite because it is fast and does not require extra services. For shared public testing, use PostgreSQL.

## Backend Environment

Recommended production variables:

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://vera:password@host:5432/vera?schema=public
JWT_SECRET=<long random secret, 32+ chars>
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://your-app.example
ALLOW_DEMO_HEADER=false
STORAGE_ADAPTER=s3
AI_PROVIDER=gemini
IIKO_ADAPTER=mock
```

Use S3/R2-compatible storage for proof photos on public deployments:

```bash
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=vera-proof-photos
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.example.com
```

Local storage is acceptable only for a short demo on a platform with a persistent disk:

```bash
STORAGE_ADAPTER=local
ACCEPT_LOCAL_STORAGE_IN_PRODUCTION=true
STORAGE_LOCAL_PUBLIC_BASE_URL=https://your-backend.example
```

Gemini extraction/transcription mode:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite
```

Iiko real adapter mode:

```bash
IIKO_ADAPTER=real
IIKO_BASE_URL=https://api-ru.iiko.services
IIKO_API_LOGIN=...
IIKO_ORGANIZATION_ID=...
```

## PostgreSQL Deploy

The repository has two Prisma schemas:

- `prisma/schema.prisma` for local/test SQLite.
- `prisma/postgres/schema.prisma` for deployed PostgreSQL.

Build/prestart commands for a backend service:

```bash
npm ci
npm run build
npm run server:pg:generate
npm run server:pg:migrate:deploy
npm start
```

Seed demo reference data after the first migration. This is idempotent and does not delete tester-created write-offs:

```bash
DATABASE_URL='postgresql://vera:password@host:5432/vera?schema=public' npm run server:pg:seed
```

For a local clean reset only:

```bash
npm run server:seed:reset
```

Docker build for PostgreSQL:

```bash
docker build -t vera-backend .
```

Then run the container with the production env vars above. Run migrations as a release/predeploy command before exposing the service.

## SQLite Local Demo

Local backend setup:

```bash
npm ci
npx prisma generate
npm run server:db:setup
npm run server:seed
npm start
```

Local SQLite is not the recommended mode for shared testing unless the host has persistent disk and the team accepts losing data on rebuilds.

## Health Checks

```bash
curl https://your-backend.example/api/health
curl https://your-backend.example/api/ready
```

API docs:

```txt
https://your-backend.example/api/docs
https://your-backend.example/api/openapi.json
```

Frontend integration notes:

```txt
docs/api-frontend.md
```

## Frontend Environment

The rewritten frontend should call the backend through:

```bash
VITE_VERA_API_URL=
```

Leave it empty in production same-origin mode. For cross-origin local development use `VITE_VERA_API_URL=http://localhost:4000`.

All protected calls must include:

```txt
Authorization: Bearer <accessToken>
```

Seeded demo accounts:

```txt
aigerim@vera.demo / VeraDemo2026! / employee
zarina@vera.demo / VeraDemo2026! / reviewer
admin@vera.demo / VeraDemo2026! / admin
```

## Runtime Checks

After deploy:

```bash
curl -X POST https://your-backend.example/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"zarina@vera.demo","password":"VeraDemo2026!"}'
```

Use the returned token to check AI/Iiko configuration:

```bash
curl -X POST https://your-backend.example/api/ai/test-provider \
  -H "Authorization: Bearer <token>"

curl -X POST https://your-backend.example/api/iiko/test-connection \
  -H "Authorization: Bearer <token>"
```

Run the full product flow verification:

```bash
VERA_API_URL=https://your-app.example/api npm run server:verify-demo
```

Current public prototype stance:

```txt
Gemini: real when GEMINI_API_KEY is configured.
Iiko: mock adapter, with Iiko-ready payloads and sync logs preserved for sponsor integration.
```
