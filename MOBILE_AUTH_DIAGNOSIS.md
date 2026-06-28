# Mobile Auth Diagnosis

Date: 2026-06-28

## Current Result

Mobile auth no longer forces signed-out users to login on startup. The app opens public marketplace first, restores stored sessions safely, and routes authenticated users by role/permission to the best available mobile workspace.

## Behavior

- No stored session: app remains on `/marketplace/projects`.
- Stored valid session: app routes once to `homeRouteForUser`.
- Stored invalid/expired session: tokens are cleared in `AuthController.restore()` and the user returns to signed-out public marketplace state.
- Wrong password: login remains signed out and shows the localized error.
- Successful login: login screen navigates to the requested protected route when allowed, otherwise to `homeRouteForUser`.
- Logout: clears session and returns to `/marketplace/projects`.

## Role Routing

- Platform roles: `/crm-leads` fallback.
- Developer roles: `/crm-leads` fallback.
- Brokerage/Broker roles: `/lead-claims` fallback.
- Client/user/visitor roles: `/marketplace/projects`.

## Security Notes

- No API contracts were changed.
- Protected workspace routes still require auth.
- Guest browsing is limited to public marketplace/profile/conversation routes.
- Permission data from `/auth/me` is used when available; role fallback is used when not.

## Tests

- signed-out app opens marketplace, not login
- login screen has Continue as guest
- successful login routes by mocked developer role
- logout returns to marketplace
- wrong login remains signed out with error
- route policy maps developer, broker, and client roles
- Arabic locale remains RTL on public marketplace
