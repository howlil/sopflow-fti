-- M11 EXPAND/BACKFILL: make Process the direct native owner of target SOPs.
-- Legacy SOPs remain nullable and keep their OPD compatibility shadow.

ALTER TABLE `Pengguna`
  MODIFY COLUMN `opdId` CHAR(36) NULL;

ALTER TABLE `SOP`
  ADD COLUMN `processId` CHAR(36) NULL AFTER `opdId`,
  ADD INDEX `SOP_processId_idx` (`processId`),
  ADD CONSTRAINT `SOP_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE `SOP` s
JOIN `ProcessSopBinding` b ON b.`sopId` = s.`sopId`
SET s.`processId` = b.`processId`
WHERE s.`processId` IS NULL;

-- A native SOP must always point at an existing Process. Legacy/unbound SOPs
-- are intentionally left NULL for the explicit compatibility path.
