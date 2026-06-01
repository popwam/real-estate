# Operations Import Worker Plan

## Current Synchronous Behavior

- `POST /import-export/operations/:type/preview` parses JSON rows or CSV text inside the API process.
- Preview writes an `ImportJob` and `ImportJobRow` records with row-level status, normalized data, errors, and warnings.
- `POST /import-export/jobs/:id/commit` currently commits valid rows synchronously.
- Invalid rows are skipped during commit.
- Already committed jobs return an idempotent committed response.

## When To Switch To Background Jobs

Move commit execution out of the API request path when any of these become common:

- imports above 1,000 rows
- commits that regularly take more than a few seconds
- retries are needed after transient database or provider-adjacent failures
- progress reporting needs live updates
- import commits begin competing with normal API latency

## Suggested Statuses

- `QUEUED`: commit requested and waiting for worker pickup.
- `PROCESSING`: worker claimed the job.
- `COMPLETED`: all valid rows were processed and final counts were stored.
- `FAILED`: unrecoverable job-level failure.
- `CANCELLED`: user cancelled before worker completion.

The current `ImportJobStatus` values can remain for synchronous jobs. Add the worker statuses only when the worker is introduced.

## Retry And Dead-Letter Plan

- Retry transient database failures with exponential backoff.
- Keep row-level failures attached to `ImportJobRow.errors`.
- Mark jobs `FAILED` after the retry budget is exhausted.
- Store dead-letter metadata as counts and safe error categories, not raw row payloads.
- Provide an admin-only remediation path to requeue failed jobs after review.

## Batch Size Recommendations

- Start with 100 rows per transaction for HR, legal, ads, and cameras.
- Start with 50 rows per transaction for accounting transactions because validation and Decimal handling are heavier.
- Keep row locks short and commit batches independently.
- Persist progress after each batch.

## Idempotency Rules

- Worker claims must be atomic.
- Reprocessing a completed job must be a no-op.
- Rows already marked `COMMITTED` must be skipped.
- Upsert-compatible imports should update by scoped id when provided.
- Create-only imports should store committed row ids in row metadata if retry support is added.

## Privacy Rules

- Do not log raw CSV or JSON row content.
- Do not log stream URLs, credentials, passwords, tokens, provider secrets, private verification tokens, or legal document bodies.
- Do not include raw filter/query values in rate-limit or queue keys.
- Store only row numbers, status, safe validation codes, and aggregate counts in worker logs.

## Progress Reporting

- Add fields such as `queuedAt`, `processingStartedAt`, `processedRows`, `committedRows`, `failedRows`, and `lastErrorCode` when the worker is implemented.
- Keep detailed row errors in `ImportJobRow`.
- API should expose progress from database state only.

## Future Queue Options

- Database polling: simplest operationally, enough for low volume.
- Redis queue: useful if Redis is already required for shared rate limits.
- BullMQ: good fit for retries, progress, and delayed jobs on Redis.
- RabbitMQ: useful if POPWAM later standardizes on brokered service messaging.

## API Versus Worker Responsibilities

API stays responsible for:

- authentication and authorization
- organization scoping
- preview parsing and row validation
- job creation and cancellation requests
- progress/detail reads

Worker becomes responsible for:

- claiming queued jobs
- committing valid rows in batches
- retrying transient failures
- updating progress counters
- marking final job status

## Never Log

- passwords or password hashes
- JWTs, refresh tokens, API keys, provider tokens, or provider secrets
- camera stream URLs or DVR credentials
- raw import CSV/JSON payloads
- private verification tokens
- full legal document text or storage URLs
- payment credentials or settlement data
