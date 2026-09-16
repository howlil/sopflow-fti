-- Retire FINAL_APPROVAL and ProcessFinalApproval completely.
-- Normalize all legacy rows before contracting enum domains and persistence.

UPDATE `DetailSOP`
SET `status` = 'TTE_PENDING'
WHERE `status` = 'FINAL_APPROVAL';

UPDATE `ProcessReview`
SET `previousStatus` = 'TTE_PENDING'
WHERE `previousStatus` = 'FINAL_APPROVAL';

UPDATE `ProcessReview`
SET `nextStatus` = 'TTE_PENDING'
WHERE `nextStatus` = 'FINAL_APPROVAL';

UPDATE `ProcessNotification`
SET `kind` = 'TTE_REQUESTED'
WHERE `kind` = 'FINAL_APPROVAL_REQUESTED';

DROP TRIGGER IF EXISTS `trg_process_final_approval_contract_insert`;
DROP TRIGGER IF EXISTS `trg_process_final_approval_contract_update`;
DROP TABLE IF EXISTS `ProcessFinalApproval`;

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
      AND NEW.`nextStatus` = 'TTE_PENDING')
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
      AND NEW.`nextStatus` = 'TTE_PENDING')
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

ALTER TABLE `DetailSOP`
  MODIFY `status` ENUM(
    'DRAFT',
    'PROCESS_REVIEW',
    'REVISION_REQUIRED',
    'TTE_PENDING',
    'EFFECTIVE',
    'SUPERSEDED',
    'REVOKED'
  ) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE `ProcessReview`
  MODIFY `previousStatus` ENUM(
    'DRAFT',
    'PROCESS_REVIEW',
    'REVISION_REQUIRED',
    'TTE_PENDING',
    'EFFECTIVE',
    'SUPERSEDED',
    'REVOKED'
  ) NOT NULL,
  MODIFY `nextStatus` ENUM(
    'DRAFT',
    'PROCESS_REVIEW',
    'REVISION_REQUIRED',
    'TTE_PENDING',
    'EFFECTIVE',
    'SUPERSEDED',
    'REVOKED'
  ) NOT NULL;

ALTER TABLE `ProcessNotification`
  MODIFY `kind` ENUM(
    'PROCESS_OWNER_REVIEW_REQUESTED',
    'TTE_REQUESTED',
    'PROCESS_REVISION_REQUESTED',
    'PROCESS_SOP_EFFECTIVE',
    'PROCESS_SOP_REVOKED'
  ) NOT NULL;
