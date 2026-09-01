# Protected Product Surfaces

This file records user-protected product surfaces. These rules are durable repository constraints, not temporary milestone preferences.

## SOP Edit Workspace — DO NOT MODIFY

The **Edit SOP workspace** must not be changed unless the current user request explicitly asks to change that workspace.

Protected meaning includes the existing authoring workspace UI/UX and behavior used to edit an SOP, including its layout, interaction model, editor/workbench composition, tabs/panels, editing controls, autosave/edit flow, and supporting presentation behavior.

Known primary surface:

- `client/src/pages/penyusun/sop/detail/DetailSOPPenyusun.tsx`

The protection is semantic, not limited to one file. Supporting hooks/components used by the Edit SOP workspace are also protected when a proposed change would alter the workspace's observable UI, UX, or editing behavior.

Examples of supporting code that must be treated carefully include:

- `client/src/pages/penyusun/sop/hooks/use-detail-sop-penyusun.ts`;
- Edit-SOP-specific components under `client/src/pages/penyusun/sop/components/`;
- shared mappers/hooks/components when a change would alter the Edit SOP workspace behavior or rendering.

### Allowed without a new explicit workspace request

- link or navigate **to** the existing Edit SOP workspace;
- preserve compatibility needed for the workspace while changing unrelated surrounding navigation/list/queue surfaces;
- backend fixes that preserve the workspace's existing observable contract and are strictly required by an approved non-workspace change;
- test-only changes that do not alter production workspace behavior.

### Not allowed without an explicit workspace request

- redesigning or restyling the workspace;
- changing its layout, tabs, panels, editor composition, or interaction flow;
- changing workspace copy merely as part of a broader vocabulary cleanup;
- moving controls or changing authoring UX for consistency with another page;
- opportunistic refactors that alter observable workspace behavior;
- using an active milestone as implied permission to touch the workspace.

If a milestone or logical change appears to require changing this protected surface, preserve the workspace and solve the requirement outside it when possible. If the requirement cannot be satisfied without modifying the workspace, stop and surface the boundary instead of changing it silently.
