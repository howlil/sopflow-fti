# Identity Shadow Retirement

Native FTI account semantics are `PlatformRole + Process relationship/eligibility + OrganizationalAuthority`.

`Pengguna.peran` and `Pengguna.opdId` are nullable historical shadows only. Native platform-account creation and Process invitation onboarding do not assign them. Authentication and current TTE profile lookup do not read them.

`RiwayatTandaTangan.peran` remains required because it is historical signing evidence, not a current-account authorization axis.

Physical deletion of retained historical fields/tables remains out of scope until production-shaped retention and rollback evidence exists.
