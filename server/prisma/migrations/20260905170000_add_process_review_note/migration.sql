-- Additive native Process Owner review note evidence.
-- Nullable during EXPAND; the native service requires a non-empty value for REVISION.

ALTER TABLE `ProcessReview`
  ADD COLUMN `catatan` TEXT NULL AFTER `decision`;
