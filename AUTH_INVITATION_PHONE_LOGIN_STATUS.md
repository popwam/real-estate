# AUTH-2 - Invitations and Phone Login Status

Date: 2026-06-24

## Summary

AUTH-2 fixed the organization invitation path and added safe phone + password login through the existing `POST /auth/login` endpoint. Existing email + password login remains compatible because the endpoint still accepts `email` as an alias.

## Current Invitation Flow

- Platform users with `organizations.verify` can create organization invitations from the Admin organization dossier.
- Invitations store organization, email, intended role, token hash, status, expiry, creator, and acceptance metadata.
- The raw token is returned only at creation time as an Admin Web `/invite/{token}` link.
- Invitation links are manual-share links. Email delivery is not claimed or implemented.
- Accepting an invitation validates token, status, and expiry, then sets a password hash and assigns the intended organization role.
- Expired and reused tokens fail safely.

## Invitation Root Cause

The invitation model and API existed, but the flow had two practical blockers:

- The invite URL fallback used `http://localhost:3001`, while the expected local Admin Web port is `3203`.
- Accepting an invite always conflicted when a matching user already existed, even if that user was a passwordless pending user shell in the same organization.

## Invitation Fix

- Invite URL generation now uses `ADMIN_WEB_URL`, then `ADMIN_WEB_BASE_URL`, then `http://localhost:3203`.
- Invite creation returns `delivery: "MANUAL_LINK"` and Admin copy says the link must be shared manually.
- Pending passwordless users in the same organization can now be linked by the invite acceptance flow.
- Existing password-backed users and users in another organization remain protected.
- Invite acceptance records an audit event.
- Invite acceptance can set a normalized optional phone number for future phone login.

## Phone Login Backend Status

Implemented through:

```text
POST /auth/login
```

Supported payloads:

```json
{ "identifier": "owner@example.com", "password": "secret" }
```

```json
{ "identifier": "+201001234567", "password": "secret" }
```

Backward-compatible payload:

```json
{ "email": "owner@example.com", "password": "secret" }
```

## Security Checks

- Passwords are verified with the existing password hash service.
- Phone login never uses code-only authentication.
- Login failures use generic `Invalid login details.` copy.
- User `isActive` is checked.
- Organization `SUSPENDED` and `REVOKED` statuses are blocked on login, refresh, and `/auth/me`.
- `/auth/login` existing rate limiting remains in place.
- Auth login success/failure is audit logged without storing the submitted identifier.
- Phone numbers are normalized before storage where phone is set by registration, invitation acceptance, or Admin user create/update.
- Application-level phone uniqueness is enforced for newly set phone numbers.

## Database Migration

No Prisma migration was applied.

Current limitation: `User.phone` exists but is not database-unique and has no normalized/indexed column. The service layer enforces uniqueness when setting phone and rejects ambiguous phone login matches, but production should add a normalized unique phone field or partial unique index before broad phone-login rollout.

## Admin UI Status

- Admin login label is now `Email or phone`.
- Organization invitations clearly state manual link sharing.
- Invitation acceptance page includes labeled fields, optional phone, secure password setup, success/error states, and an unavailable-token state.
- Admin does not show or set plaintext passwords outside the invitation acceptance flow.

## Mobile Status

- Mobile login label is now `Email or phone`.
- Mobile sends `{ identifier, password }` to `/auth/login`.
- Secure token storage and `/auth/me` validation remain unchanged.
- Wrong login failures stop loading and show safe error copy.

## Tests Added

Backend:

- Auth email login compatibility.
- Phone login success.
- Wrong password.
- Unknown phone.
- Inactive user.
- Suspended organization.
- Invitation creation.
- Manual invite link.
- Expired invitation.
- Reused invitation.
- Role assignment.
- Pending passwordless user linking.

Mobile:

- Login screen exposes `Email or phone`.
- Auth controller returns to signed-out state on login failure.

## Remaining Blockers

- Database-level unique normalized phone is still needed before production scale.
- Phone verification is not implemented.
- Email/SMS delivery for invitations is not implemented.
- Admin user management still distinguishes HR employee records from login users; employee-code login remains a separate backend-led feature.

