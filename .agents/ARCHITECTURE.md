# ARCHITECTURE

## Target architecture

```text
Pengguna + PlatformRole
        |
        +--> ProcessOwnerAuthority ----> Process ----> SOP ----> DetailSOP
        |                                  |             |
        +--> ProcessMember ----------------+             +--> Review / Approval / TTE / Version
        |
        +--> OrganizationalAuthorityAssignment
                 |
                 +--> DEAN (Faculty)
                 +--> HEAD_OF_DEPARTMENT (Department)
```

### Identity and authorization

`PlatformRole` is only platform administration. Workflow authorization is contextual to Process ownership/membership. Final approval and TTE authorization come only from the organizational authority resolved for the Process scope. No platform administrator bypass exists for workflow approval or signing.

### SOP ownership

An active SOP belongs directly to one Process through `SOP.processId`. A Process has exactly one owner and zero or more members. Department context is organizational scope metadata, not SOP ownership.

### Lifecycle

`DRAFT -> PROCESS_REVIEW -> REVISION_REQUIRED | FINAL_APPROVAL -> TTE_PENDING -> EFFECTIVE -> SUPERSEDED | REVOKED`. Review, final approval, signing evidence, publication, version replacement, and revocation must transition this lifecycle atomically where required.

### TTE

Signing evidence stores `OrganizationalAuthority` (`DEAN` or `HEAD_OF_DEPARTMENT`) plus signer identity and certificate metadata. Public verification exposes this authority directly.

### Catalogs

Peraturan and Pelaksana are reusable global catalogs. Procedure and diagram engines consume them without organization ownership shadows.

### Persistence history

Previously applied migration SQL remains immutable so an old database can be migrated forward deterministically. Historical identifiers inside those SQL files are migration mechanics, not application architecture.
