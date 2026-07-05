# I18N Full Audit

Date: 2026-07-03

## Summary

- Total hardcoded visible-string candidates found: 261
- Scope: Admin Web, Public Web, and Mobile source trees requested in the prompt.
- Method: conservative static scan for JSX text/visible attributes and Dart string literals, plus catalog key parity.
- Note: candidates require human review because static scans can include non-visible constants and API/status values.

## Catalog Parity

| App | English message keys | Arabic message keys | French message keys | Arabic DOM keys | French DOM keys | Missing Arabic | Missing French |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| admin-web | 948 | 948 | 948 | 170 | 170 | 0 | 0 |
| public-web | 260 | 260 | 260 | 122 | 122 | 0 | 0 |
| mobile | 356 | 356 | 356 | 0 | 0 | 0 | 0 |

## Remaining English Literal Candidates

### admin-web

Total candidates reviewed: 0
Converted/already localized by DOM safety net: 0
Ignored/classified non-UI: 0
Remaining true visible UI candidates: 0

Classification counts:



### public-web

Total candidates reviewed: 21
Converted/already localized by DOM safety net: 21
Ignored/classified non-UI: 0
Remaining true visible UI candidates: 0

Classification counts:

- translated-dom-safety-net: 21

- apps/public-web/src/components/cta/sticky-cta-bar.tsx: 4
  - L25: [translated-dom-safety-net] Request details
  - L30: [translated-dom-safety-net] Open the contact form to request a call
  - L32: [translated-dom-safety-net] Request a call
  - L41: [translated-dom-safety-net] WhatsApp
- apps/public-web/src/components/marketplace/project-media-visual.tsx: 3
  - L36: [translated-dom-safety-net] Project media not available
  - L45: [translated-dom-safety-net] Project media will appear here when available.
  - L48: [translated-dom-safety-net] The listing can still be reviewed through its published details.
- apps/public-web/src/components/organization/organization-project-grid.tsx: 3
  - L60: [translated-dom-safety-net] Type
  - L68: [translated-dom-safety-net] Pricing
  - L75: [translated-dom-safety-net] View project
- apps/public-web/src/components/public/public-header.tsx: 3
  - L13: [translated-dom-safety-net] POPWAM home
  - L20: [translated-dom-safety-net] Verified real estate
  - L25: [translated-dom-safety-net] Marketplace navigation
- apps/public-web/src/components/public/public-shell.tsx: 3
  - L37: [translated-dom-safety-net] POPWAM home
  - L41: [translated-dom-safety-net] Private conversation link
  - L43: [translated-dom-safety-net] Private conversation
- apps/public-web/src/components/cta/call-placeholder-button.tsx: 2
  - L5: [translated-dom-safety-net] Open the contact form to request a call
  - L8: [translated-dom-safety-net] Request a call
- apps/public-web/src/components/conversation/public-conversation-shell.tsx: 1
  - L22: [translated-dom-safety-net] Private conversation
- apps/public-web/src/components/forms/form-privacy-notice.tsx: 1
  - L4: [translated-dom-safety-net] POPWAM uses your details only to route this request to the relevant organization for follow-up.
- apps/public-web/src/components/marketplace/project-detail-hero.tsx: 1
  - L51: [translated-dom-safety-net] Request details

### mobile

Total candidates reviewed: 240
Converted/already localized by DOM safety net: 0
Ignored/classified non-UI: 238
Remaining true visible UI candidates: 2

Classification counts:

- api-or-code-data: 200
- debug-only: 12
- non-visible-code-constant: 26
- true-visible-ui-copy: 2

- apps/mobile/lib/features/marketplace/data/marketplace_models.dart: 23
  - L45: [api-or-code-data] Location pending
  - L50: [api-or-code-data] Price on request
  - L56: [api-or-code-data] From $value
  - L57: [api-or-code-data] From $currency $value
  - L62: [api-or-code-data] inventoryUnits
- apps/mobile/lib/features/deal_rooms/data/deal_room_models.dart: 18
  - L103: [api-or-code-data] reservationRequest
  - L121: [api-or-code-data] reservationRequestId
  - L122: [api-or-code-data] projectId
  - L123: [api-or-code-data] unitId
  - L124: [api-or-code-data] createdAt
- apps/mobile/lib/core/localization/l10n_extensions.dart: 14
  - L104: [non-visible-code-constant] Invalid login details.
  - L105: [non-visible-code-constant] Your session expired. Please sign in again.
  - L106: [non-visible-code-constant] You do not have access to this mobile workspace.
  - L108: [non-visible-code-constant] The requested mobile resource was not found.
  - L110: [non-visible-code-constant] You do not have access to this deal room
- apps/mobile/lib/features/crm/data/crm_models.dart: 14
  - L79: [api-or-code-data] newLeads
  - L80: [api-or-code-data] newMessages
  - L95: [api-or-code-data] preferredContactMethod
  - L96: [api-or-code-data] pageSize
  - L120: [api-or-code-data] Client
- apps/mobile/lib/features/conversations/data/conversation_models.dart: 13
  - L30: [api-or-code-data] pageSize
  - L56: [api-or-code-data] publicRole
  - L57: [api-or-code-data] displayName
  - L58: [api-or-code-data] joinedAt
  - L79: [api-or-code-data] senderParticipant
- apps/mobile/lib/features/lead_claims/data/lead_claim_models.dart: 12
  - L58: [api-or-code-data] Phone hidden
  - L71: [api-or-code-data] projectId
  - L72: [api-or-code-data] unitId
  - L78: [api-or-code-data] expiresAt
  - L79: [api-or-code-data] createdAt
- apps/mobile/lib/core/errors/api_error.dart: 11
  - L13: [non-visible-code-constant] The API is taking too long to respond. Please check your connection and try again.
  - L15: [non-visible-code-constant] Could not reach the API. Check your internet connection or API environment.
  - L17: [non-visible-code-constant] The secure connection could not be verified. Please contact support.
  - L19: [non-visible-code-constant] The request was cancelled. Please try again.
  - L28: [non-visible-code-constant] Invalid login details.
- apps/mobile/lib/features/attendance/data/attendance_models.dart: 11
  - L42: [api-or-code-data] employeeId
  - L43: [api-or-code-data] checkInAt
  - L44: [api-or-code-data] checkOutAt
  - L47: [api-or-code-data] verificationStatus
  - L49: [api-or-code-data] verificationFailureReasons
- apps/mobile/lib/features/deals/data/deal_models.dart: 11
  - L69: [api-or-code-data] dealRoom
  - L75: [api-or-code-data] firstName
  - L76: [api-or-code-data] lastName
  - L83: [api-or-code-data] dealRoomId
  - L84: [api-or-code-data] projectId
- apps/mobile/lib/core/network/api_client.dart: 9
  - L14: [api-or-code-data] Accept
  - L42: [api-or-code-data] Authorization
  - L42: [api-or-code-data] Bearer $accessToken
  - L66: [api-or-code-data] refreshToken
  - L67: [api-or-code-data] Authorization
- apps/mobile/lib/features/auth/data/auth_repository.dart: 9
  - L22: [debug-only] Login request started
  - L32: [api-or-code-data] accessToken
  - L33: [api-or-code-data] refreshToken
  - L36: [debug-only] Login failed: token payload missing
  - L38: [api-or-code-data] Login response was incomplete. Please try again.
- apps/mobile/lib/features/auth/presentation/auth_controller.dart: 9
  - L52: [debug-only] Restoring stored mobile session
  - L59: [debug-only] No stored session found
  - L65: [debug-only] Stored session found; loading current user
  - L67: [debug-only] Stored session restored
  - L74: [debug-only] Stored session restore failed
- apps/mobile/lib/features/marketplace/data/marketplace_filters.dart: 9
  - L50: [api-or-code-data] unitType
  - L51: [api-or-code-data] minPrice
  - L52: [api-or-code-data] maxPrice
  - L58: [api-or-code-data] projectId
  - L61: [api-or-code-data] unitType
- apps/mobile/lib/features/reservation_requests/data/reservation_request_models.dart: 9
  - L64: [api-or-code-data] leadClaim
  - L69: [api-or-code-data] leadClaimId
  - L70: [api-or-code-data] projectId
  - L71: [api-or-code-data] unitId
  - L73: [api-or-code-data] rejectionReason
- apps/mobile/lib/features/commissions/data/commission_models.dart: 7
  - L87: [api-or-code-data] dealId
  - L89: [api-or-code-data] partyType
  - L92: [api-or-code-data] commissionType
  - L93: [api-or-code-data] createdAt
  - L94: [api-or-code-data] approvedAt
- apps/mobile/lib/features/crm/data/crm_repository.dart: 7
  - L38: [api-or-code-data] /crm/leads/$id
  - L44: [api-or-code-data] /crm/leads/$id/claim
  - L55: [api-or-code-data] /crm/leads/$id/status
  - L59: [api-or-code-data] statusNote
  - L67: [api-or-code-data] /conversations/from-crm-lead/$id
- apps/mobile/lib/features/deal_rooms/data/deal_rooms_repository.dart: 7
  - L21: [api-or-code-data] /deal-rooms/$id
  - L27: [api-or-code-data] /deal-rooms/from-reservation/$reservationRequestId
  - L33: [api-or-code-data] /deal-rooms/$id/invite-client
  - L38: [api-or-code-data] /deal-rooms/$id/status
  - L45: [api-or-code-data] /deal-rooms/$id/messages
- apps/mobile/lib/features/attendance/data/attendance_repository.dart: 6
  - L84: [api-or-code-data] wifiSsid
  - L86: [api-or-code-data] wifiBssid
  - L88: [api-or-code-data] photoFileId
  - L90: [api-or-code-data] deviceId
  - L92: [api-or-code-data] developerOptionsEnabled
- apps/mobile/lib/features/marketplace/data/marketplace_repository.dart: 6
  - L28: [api-or-code-data] /marketplace/projects/$id
  - L49: [api-or-code-data] /marketplace/units/$id
  - L65: [api-or-code-data] minLat
  - L66: [api-or-code-data] maxLat
  - L67: [api-or-code-data] minLng
- apps/mobile/lib/features/conversations/data/conversations_repository.dart: 5
  - L23: [api-or-code-data] /conversations/$id
  - L29: [api-or-code-data] /conversations/$id/messages
  - L39: [api-or-code-data] /conversations/$id/messages
  - L51: [api-or-code-data] /conversations/$id/status
  - L55: [api-or-code-data] statusNote
- apps/mobile/lib/features/lead_claims/data/lead_claims_repository.dart: 5
  - L22: [api-or-code-data] clientName
  - L24: [api-or-code-data] projectId
  - L25: [api-or-code-data] unitId
  - L42: [api-or-code-data] /lead-claims/$id
  - L48: [api-or-code-data] /lead-claims/$id/release
- apps/mobile/lib/features/reservation_requests/data/reservation_requests_repository.dart: 4
  - L20: [api-or-code-data] leadClaimId
  - L21: [api-or-code-data] unitId
  - L38: [api-or-code-data] /reservation-requests/$id
  - L45: [api-or-code-data] /reservation-requests/$id/cancel
- apps/mobile/lib/features/attendance/services/attendance_device_integrity_service.dart: 3
  - L44: [api-or-code-data] readAndroidDebugSettings
  - L57: [api-or-code-data] developerOptionsEnabled
  - L58: [api-or-code-data] usbDebuggingEnabled
- apps/mobile/lib/features/auth/data/auth_models.dart: 3
  - L32: [api-or-code-data] userRole
  - L33: [api-or-code-data] firstName
  - L34: [api-or-code-data] lastName
- apps/mobile/lib/features/profile/data/broker_profile_models.dart: 3
  - L27: [api-or-code-data] licenseNumber
  - L28: [api-or-code-data] displayName
  - L33: [api-or-code-data] yearsOfExperience
- apps/mobile/lib/core/router/app_router.dart: 2
  - L227: [api-or-code-data] projectId
  - L236: [api-or-code-data] unitId
- apps/mobile/lib/core/router/auth_route_policy.dart: 2
  - L35: [api-or-code-data] $prefix/
  - L205: [api-or-code-data] $prefix/
- apps/mobile/lib/core/utils/auth_debug_log.dart: 1
  - L5: [debug-only] [auth] $message
- apps/mobile/lib/core/utils/money_formatters.dart: 1
  - L9: [non-visible-code-constant] Amount pending
- apps/mobile/lib/features/attendance/presentation/attendance_screen.dart: 1
  - L419: [true-visible-ui-copy] No employee profile is linked to this account.
- apps/mobile/lib/features/attendance/services/attendance_photo_service.dart: 1
  - L66: [api-or-code-data] fileId
- apps/mobile/lib/features/attendance/services/attendance_wifi_service.dart: 1
  - L54: [true-visible-ui-copy] <unknown ssid>
- apps/mobile/lib/features/commissions/data/commissions_repository.dart: 1
  - L21: [api-or-code-data] /commissions/$id
- apps/mobile/lib/features/crm/presentation/crm_lead_detail_screen.dart: 1
  - L210: [api-or-code-data] /crm-conversations/$conversationId
- apps/mobile/lib/features/deals/data/deals_repository.dart: 1
  - L21: [api-or-code-data] /deals/$id

## Fixed In This Slice

- Added repeatable i18n audit and missing-key report generation through `scripts/i18n-audit.mjs`.
- Added catalog parity reporting for Admin Web, Public Web, and Mobile.
- Added server-safe web i18n helpers in Admin Web and Public Web.
- Mirrored the selected web locale to a `popwam-locale` cookie so Server Components can use the same catalog on subsequent requests.
- Converted Admin login and CRM tasks visible copy to keyed translations.
- Converted Public home, projects, and public contact form visible copy to keyed translations.
- Classified mobile auth debug log strings as debug-only rather than visible UI copy.
- Current reviewed counts after this slice: Admin 770 reviewed / 663 remaining, Public 176 reviewed / 93 remaining, Mobile 208 reviewed / 0 remaining.
- Catalog parity remains 0 missing Arabic keys and 0 missing French keys for Admin Web, Public Web, and Mobile.

## Intentionally API-Provided Data

- Organization names, project names, user names, domains, emails, phone numbers, message bodies, notes, free-text descriptions, and token values remain API-provided data.
- Frontend enum/status labels should stay localized through frontend maps/catalog keys.

## Remaining Work

- Continue converting the remaining Admin/Public literal candidates to explicit `t()`/`tServer()` keys where they are visible UI copy.
- Keep DOM translation only as a compatibility safety net, not the primary production strategy.
