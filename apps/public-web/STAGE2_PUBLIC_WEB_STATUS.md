# STAGE2_PUBLIC_WEB_STATUS.md

## Current Slice

Slice 3 — Public Conversation Reply UI

## Percentage Completed

60%

## What Was Done

- Added a safe public reply composer to `/c/[token]`.
- Wired public token replies to `POST /conversations/by-token/:shareToken/messages`.
- Preserved the existing public conversation timeline and public-safe route.
- Added client-side validation for empty and too-long messages.
- Added friendly public error handling for validation, invalid/expired token, and `429` rate-limit responses.
- Refreshes conversation data after a successful reply so the new message appears in the timeline.
- Preserved `api`, `mock`, and `hybrid` data modes.
- Kept all work inside `apps/public-web`.

## Files Created

- `apps/public-web/src/components/conversation/public-conversation-view.tsx`

## Files Modified

- `apps/public-web/src/lib/public-api.ts`
- `apps/public-web/src/lib/public-data.ts`
- `apps/public-web/src/app/c/[token]/page.tsx`
- `apps/public-web/STAGE2_PUBLIC_WEB_STATUS.md`

## Routes Updated

- `/c/[token]`

## API Client Updates

- Added `PostConversationMessageByTokenPayload`.
- Added `PublicConversationTokenMessageResponse`.
- Added `postConversationMessageByToken(token, payload)` for `POST /conversations/by-token/:shareToken/messages`.
- Added `postPublicConversationMessageByToken(token, payload)` in the public data adapter.
- Added `isPublicConversationMessageRateLimitError(error)`.

## Reply Composer Behavior

- The composer is visible only when the conversation status is `OPEN`.
- Fields:
  - optional sender name
  - required plain-text message body
- Message body is trimmed before submission.
- On success:
  - message body is cleared
  - sent state is shown
  - conversation data is reloaded
  - if reload fails, the returned safe message is appended locally
- If the conversation is `CLOSED` or `ARCHIVED`, the composer is hidden and the page shows: `This conversation is closed.`

## Error Handling

- Empty message: `Please enter a message before sending.`
- Too-long message: `Message is too long. Please keep it under 2000 characters.`
- `429`: `Too many messages. Please try again shortly.`
- `404`: `This conversation link is no longer available.`
- Generic failure: `Could not send your message. Please try again.`

## Data Mode Behavior

- `api`: posts only to the real backend token-scoped endpoint.
- `mock`: allows local demo/mock send state for mock conversations.
- `hybrid`: uses API for real tokens and only falls back to mock send behavior for `mock-chat-*` demo links.
- API-mode does not fabricate conversation links or message posting success.

## Safety Rules

- No authenticated public requests were added.
- `/c/[token]` uses only public-safe token endpoints.
- Message bodies render as escaped plain React text; no HTML rendering or rich text editor was added.
- No private inventory, unit numbers, internal broker identities, CRM internals, client IDs, user IDs, lead claims, reservations, deals, commissions, audit logs, or private metadata are requested or displayed.
- No backend, Admin Web, Mobile, Workers, or AI/DVR files were modified.

## Commands Run

- `pnpm.cmd --filter public-web build`

## Build Result

- PASS. Next.js production build and TypeScript completed successfully.
- Build output includes the dynamic route `/c/[token]`.

## Missing / Not Done

- No backend changes.
- No Admin Web changes.
- No Mobile, Workers, or AI/DVR changes.
- No WebSocket.
- No real chat provider.
- No WhatsApp Business API.
- No attachments.
- No voice notes.
- No notification provider.
- No live browser smoke was run against a running API in this pass.

## Dependencies

- Requires Stage 2 CRM Backend Slice 4 endpoint `POST /conversations/by-token/:shareToken/messages`.
- API mode expects `NEXT_PUBLIC_API_BASE_URL` to point at a running backend.
- Backend remains source of truth for token validity, conversation status, rate limiting, and public-safe serialization.

## Next Slice Recommendation

- Rerun Stage 2 Playwright browser smoke with API/Admin/Public servers and assert public `/c/[token]` reply posting.
- Add mobile `/c/:token` public reply UI after mobile deep-link UX is approved.
- Add production-grade shared rate limiting before production rollout.
- Add notification/provider hooks only after provider contracts are approved.

## Previous Slice Summary

- Slice 1 connected Public Web to Stage 2 public marketplace, organization, domain, and lead capture APIs.
- Slice 2 added Request Call, Start Chat, WhatsApp contact options, real API-mode chat link display, and the initial public-safe `/c/[token]` route.
- A later backend slice added the token-scoped public message posting endpoint now used by this Slice 3 UI.

## Codex Prompt Used

```text
Stage 2 Team 5 — Public Conversation Reply UI

Implement Stage 2 Team 5 Slice — Public Conversation Reply UI.

Goal:
Add a safe public reply composer to /c/[token] in Public Web.

Work only inside apps/public-web. Do not modify apps/api, apps/admin-web, apps/mobile, workers, or apps/ai-dvr.

Add senderName/body composer for open conversations; post to POST /conversations/by-token/:shareToken/messages; trim/validate body; handle 400/404/429; refresh timeline after send; hide composer for closed/archived conversations; preserve api/mock/hybrid modes; do not add WebSocket, real chat provider, WhatsApp provider, attachments, notifications, or UI redesign.
```
