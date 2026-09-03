-- Extend the target-native Process notification event catalog for lifecycle feedback.
-- Existing rows remain valid; no legacy notification persistence is changed.
ALTER TABLE `ProcessNotification`
  MODIFY `kind` ENUM(
    'PROCESS_OWNER_REVIEW_REQUESTED',
    'FINAL_APPROVAL_REQUESTED',
    'PROCESS_REVISION_REQUESTED',
    'PROCESS_SOP_EFFECTIVE',
    'PROCESS_SOP_REVOKED'
  ) NOT NULL;
