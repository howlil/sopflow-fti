-- Every SOP in the FTI target model must belong to exactly one Process.
-- This ALTER intentionally fails if the target database still contains unbound SOP rows;
-- migration must never delete or silently invent ownership for historical data.
ALTER TABLE `SOP`
  MODIFY `processId` CHAR(36) NOT NULL;

-- processId NOT NULL + the existing foreign key now enforce these guarantees directly.
-- The transitional nullability triggers are redundant after the contraction.
DROP TRIGGER IF EXISTS `trg_detailsop_active_process_insert`;
DROP TRIGGER IF EXISTS `trg_detailsop_active_process_update`;
DROP TRIGGER IF EXISTS `trg_sop_active_process_update`;
