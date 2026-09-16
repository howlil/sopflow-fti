-- Direct TTE workflow: an accepted Process Owner review moves the latest SOP
-- directly to TTE_PENDING. FINAL_APPROVAL remains accepted here only for
-- historical rows created before this migration.
ALTER TABLE `ProcessNotification`
  MODIFY `kind` ENUM(
    'PROCESS_OWNER_REVIEW_REQUESTED',
    'FINAL_APPROVAL_REQUESTED',
    'TTE_REQUESTED',
    'PROCESS_REVISION_REQUESTED',
    'PROCESS_SOP_EFFECTIVE',
    'PROCESS_SOP_REVOKED'
  ) NOT NULL;

DROP TRIGGER IF EXISTS `trg_process_review_contract_insert`;
CREATE TRIGGER `trg_process_review_contract_insert`
BEFORE INSERT ON `ProcessReview`
FOR EACH ROW
BEGIN
  IF NOT (
    (NEW.`decision` = 'REVISION'
      AND NEW.`previousStatus` = 'PROCESS_REVIEW'
      AND NEW.`nextStatus` = 'REVISION_REQUIRED'
      AND NEW.`catatan` IS NOT NULL
      AND CHAR_LENGTH(TRIM(NEW.`catatan`)) > 0)
    OR
    (NEW.`decision` = 'ACCEPT'
      AND NEW.`previousStatus` = 'PROCESS_REVIEW'
      AND NEW.`nextStatus` IN ('TTE_PENDING', 'FINAL_APPROVAL'))
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ProcessReview decision/status tidak valid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    JOIN `SOP` s ON s.`sopId` = d.`sopId`
    JOIN `Process` p ON p.`processId` = NEW.`processId`
    WHERE d.`detailSopId` = NEW.`detailSopId`
      AND d.`sopId` = NEW.`sopId`
      AND s.`processId` = NEW.`processId`
      AND p.`ownerId` = NEW.`reviewedById`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ProcessReview harus dibuat oleh owner Process untuk SOP yang sama';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_review_contract_update`;
CREATE TRIGGER `trg_process_review_contract_update`
BEFORE UPDATE ON `ProcessReview`
FOR EACH ROW
BEGIN
  IF NOT (
    (NEW.`decision` = 'REVISION'
      AND NEW.`previousStatus` = 'PROCESS_REVIEW'
      AND NEW.`nextStatus` = 'REVISION_REQUIRED'
      AND NEW.`catatan` IS NOT NULL
      AND CHAR_LENGTH(TRIM(NEW.`catatan`)) > 0)
    OR
    (NEW.`decision` = 'ACCEPT'
      AND NEW.`previousStatus` = 'PROCESS_REVIEW'
      AND NEW.`nextStatus` IN ('TTE_PENDING', 'FINAL_APPROVAL'))
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ProcessReview decision/status tidak valid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    JOIN `SOP` s ON s.`sopId` = d.`sopId`
    JOIN `Process` p ON p.`processId` = NEW.`processId`
    WHERE d.`detailSopId` = NEW.`detailSopId`
      AND d.`sopId` = NEW.`sopId`
      AND s.`processId` = NEW.`processId`
      AND p.`ownerId` = NEW.`reviewedById`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ProcessReview harus dibuat oleh owner Process untuk SOP yang sama';
  END IF;
END;
