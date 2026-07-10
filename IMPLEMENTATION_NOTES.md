## HR Access / Employee Invitation / Sidebar Fix

- HR module availability: HR employee, department, attendance, summary, report, and HR export endpoints now use permission-scoped HR workspace access instead of developer-only organization type checks.
- Platform Owner access: Platform users with HR permissions can open the existing `/developer/hr/employees` pages; employee creation requires selecting a target organization.
- Company/Brokerage scoping: Company and brokerage users stay scoped to their own organization on the backend; cross-organization employee creation/list access is rejected or ignored according to endpoint scope.
- Employee login fix: Employee creation creates a linked `User` with the same `HashService` password hash used by `/auth/login`; login failures now record safe internal audit reasons such as missing password, inactive employee, or inactive organization.
- Invitation/temporary password flow: Admin can enter or generate a temporary password; the backend hashes it and never stores plaintext. The admin UI shows the temporary password once after creation with secure handoff copy.
- Permission assignment: Employee role templates and custom permissions remain backend-enforced. Company HR cannot assign platform permissions, users cannot change their own permissions, and platform permissions are only visible to platform users.
- Sidebar hover/scroll: Collapsed sidebar hover labels were removed from the icon sidebar and overflow button; widths are stable and horizontal overflow is hidden.
- i18n: New visible HR access, organization selector, login-readiness, and temporary-password strings were added in English, Arabic, and French.
- Tests: Focused backend tests cover employee creation, brokerage HR creation, platform selected-organization creation, platform filtered listing, cross-organization blocking, platform permission blocking, self-permission blocking, reset hashing, deactivation, and missing-password login diagnostics.
- Remaining manual QA: Run through Platform Owner, company admin, brokerage admin, HR manager, limited employee, employee login, sidebar hover, and Arabic/French checks using the manual checklist from the task.
