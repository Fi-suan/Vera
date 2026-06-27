# VERA Frontend API Contract

Base URL:

```txt
${VITE_API_URL}
```

For local development:

```txt
http://localhost:4000/api
```

All protected requests use:

```txt
Authorization: Bearer <accessToken>
```

## Auth

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "aigerim@vera.demo",
  "password": "VeraDemo2026!"
}
```

Response:

```json
{
  "user": {
    "id": "user-aigerim",
    "name": "Aigerim",
    "email": "aigerim@vera.demo",
    "role": "employee",
    "tradePointId": "tp-aktau"
  },
  "accessToken": "...",
  "tokenType": "Bearer"
}
```

### Current User

```http
GET /auth/me
```

Use this after page reload to restore the session from a saved token.

## Bootstrap Data

```http
GET /bootstrap
```

Returns:

- `users` for employee/reviewer/deduction selectors.
- `tradePoints` for trade point selectors.
- `products` for product search/autocomplete.

## Employee Flow

### 1. Transcribe Voice

For mock/dev transcript:

```http
POST /write-offs/transcribe
Content-Type: application/json

{
  "mockTranscript": "Списать 2 круассана на Достык, сгорели в печи, без удержания"
}
```

For real audio:

```http
POST /write-offs/transcribe
Content-Type: multipart/form-data

audio=<file>
```

Response:

```json
{
  "transcript": "Списать 2 круассана...",
  "provider": "gemini"
}
```

### 2. Extract Structured Fields

```http
POST /write-offs/extract
Content-Type: application/json

{
  "transcript": "Списать 2 круассана на Достык, сгорели в печи, без удержания"
}
```

Use response fields to prefill the form:

```json
{
  "productId": "p-croissants",
  "productName": "Croissants",
  "quantity": 2,
  "unit": "pcs",
  "tradePointId": "tp-dostyk",
  "reason": "Burned during cooking",
  "deductionType": "without_deduction",
  "comment": "2 croissants burned in the oven and are not suitable for sale.",
  "missingFields": ["photoUrl"],
  "confidenceScore": 0.86,
  "provider": "gemini"
}
```

Gemini is a helper, not the source of truth. The backend still validates required fields and catalog IDs.

### 3. Create Request

```http
POST /write-offs
Content-Type: application/json

{
  "tradePointId": "tp-dostyk",
  "productId": "p-croissants",
  "quantity": 2,
  "unit": "pcs",
  "reason": "Burned during cooking",
  "deductionType": "without_deduction",
  "comment": "2 croissants burned in the oven and are not suitable for sale.",
  "voiceTranscript": "Списать 2 круассана...",
  "aiExtractedFields": {},
  "aiGeneratedComment": "2 croissants burned in the oven and are not suitable for sale.",
  "aiConfidenceScore": 0.86
}
```

If proof photo is missing, response status will be `missing_info`. If all required fields are present, status will be `pending_review`.

### 4. Attach Photo

Use uploaded file:

```http
POST /write-offs/{id}/photo
Content-Type: multipart/form-data

photo=<file>
```

Or existing URL:

```http
POST /write-offs/{id}/photo
Content-Type: application/json

{
  "photoUrl": "https://example.com/proof.jpg"
}
```

### 5. Edit Before Review

```http
PATCH /write-offs/{id}
Content-Type: application/json

{
  "quantity": 3,
  "comment": "3 croissants burned in the oven and are not suitable for sale."
}
```

Allowed only while status is `draft` or `missing_info`.

### 6. Submit

```http
POST /write-offs/{id}/submit
```

If required fields are still missing, response is `422`:

```json
{
  "error": "Unprocessable Entity",
  "message": "Request is missing required fields",
  "details": {
    "missingFields": ["photoUrl"]
  }
}
```

### 7. Employee History

```http
GET /me/write-offs
```

Use this for employee home/history screens.

## Reviewer Flow

### Queue

```http
GET /reviewer/write-offs?status=pending_review&tradePointId=tp-dostyk
```

Supported filters:

- `status`
- `tradePointId`
- `employeeId`
- `dateFrom`
- `dateTo`
- `deductionType`

### Full Card

```http
GET /write-offs/{id}
```

Returns request details, audit `events`, Iiko `syncLogs`, and frontend-friendly `ui`.

### Approve

```http
POST /write-offs/{id}/approve
```

Rules:

- reviewer/admin only
- employee cannot approve own request
- only `pending_review`
- approval triggers Iiko adapter sync

Final status becomes either `synced_to_iiko` or `iiko_sync_failed`.

### Reject

```http
POST /write-offs/{id}/reject
Content-Type: application/json

{
  "reason": "Photo does not match the product"
}
```

### Retry Iiko Sync

```http
POST /iiko/retry/{requestId}
```

Allowed only for `iiko_sync_failed`.

### Sync Logs

```http
GET /iiko/sync-logs
```

Use this for admin/debug screens.

## Write-Off Statuses

```txt
draft
missing_info
pending_review
approved
rejected
syncing_to_iiko
synced_to_iiko
iiko_sync_failed
```

Frontend display can use `request.ui.statusLabel` and `request.ui.statusTone` instead of hardcoding labels.

## Deduction Types

```txt
without_deduction
with_deduction
```

If `deductionType=with_deduction`, `deductionEmployeeId` is required.

## Frontend-Friendly Request Fields

Every write-off response keeps raw fields and includes a `ui` block:

```json
{
  "id": "wo-123",
  "doc": "WO-123",
  "status": "pending_review",
  "product": { "name": "Croissants" },
  "tradePoint": { "name": "Dostyk" },
  "missingFields": [],
  "events": [],
  "syncLogs": [],
  "ui": {
    "title": "Croissants",
    "subtitle": "2 pcs · Dostyk",
    "statusLabel": "Waiting for review",
    "statusTone": "info",
    "productName": "Croissants",
    "tradePointName": "Dostyk",
    "employeeName": "Aigerim",
    "reviewerName": null,
    "quantityLabel": "2 pcs",
    "costLabel": "₸1,800",
    "photoRequired": false,
    "missingFieldLabels": [],
    "sync": {
      "status": "idle",
      "label": "Not synced",
      "tone": "neutral",
      "documentId": null
    },
    "actions": {
      "canEdit": false,
      "canAttachPhoto": false,
      "canSubmit": false,
      "canApprove": true,
      "canReject": true,
      "canRetryIikoSync": false
    },
    "primaryAction": "approve",
    "timeline": [],
    "latestSyncLog": null
  }
}
```

The frontend should prefer `ui.actions` to decide which buttons to show. The backend still enforces all permissions.

## Demo Accounts

```txt
aigerim@vera.demo / VeraDemo2026! / employee
zarina@vera.demo / VeraDemo2026! / reviewer
admin@vera.demo / VeraDemo2026! / admin
```

## API Docs

Swagger:

```txt
/docs
```

OpenAPI JSON:

```txt
/openapi.json
```
