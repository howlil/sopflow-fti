# CODE PATTERNS

## Domain vocabulary

Use these concepts in new code:
- `PlatformRole.SUPER_ADMIN | USER`
- `Process.ownerId`
- `ProcessMember`
- `OrganizationalScope.FACULTY | DEPARTMENT`
- `OrganizationalAuthority.DEAN | HEAD_OF_DEPARTMENT`
- `StatusSOP.DRAFT | PROCESS_REVIEW | REVISION_REQUIRED | FINAL_APPROVAL | TTE_PENDING | EFFECTIVE | SUPERSEDED | REVOKED`
- `BagianSOP.REVIEW` for review activity.

## Authorization

Resolve authorization from the owning Process and its relationships. Do not infer workflow authority from account profile fields or platform administration. Resolve legal approval/TTE authority using `OrganizationalAuthorityService`.

## Repository boundaries

Repositories should select only fields required by their domain. Keep identity/session, Process relationship, organizational authority, SOP lifecycle, TTE, catalog, and presentation concerns separate.

## Testing

Fixtures should represent native actors: platform admin, Process Owner, Process Member, Dean, and Department Head. Test native lifecycle states directly. Prefer focused unit tests plus real-boundary migration/database checks; do not recreate retired product models in fixtures.

## Migration rule

Never edit an already-applied migration merely to rename historical vocabulary. New target code must not depend on historical migration structures.
