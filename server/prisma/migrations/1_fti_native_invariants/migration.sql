-- FTI-native database invariants that are not expressible in Prisma schema.

-- Replace the one-active-version invariant deterministically.
DROP TRIGGER IF EXISTS `trg_detailsop_one_berlaku_insert`;
DROP TRIGGER IF EXISTS `trg_detailsop_one_berlaku_update`;
DROP TRIGGER IF EXISTS `trg_detailsop_one_effective_insert`;
DROP TRIGGER IF EXISTS `trg_detailsop_one_effective_update`;

CREATE TRIGGER `trg_detailsop_one_effective_insert`
BEFORE INSERT ON `DetailSOP`
FOR EACH ROW
BEGIN
  IF NEW.`status` = 'EFFECTIVE' AND EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    WHERE d.`sopId` = NEW.`sopId`
      AND d.`status` = 'EFFECTIVE'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hanya satu DetailSOP EFFECTIVE per SOP';
  END IF;
END;

CREATE TRIGGER `trg_detailsop_one_effective_update`
BEFORE UPDATE ON `DetailSOP`
FOR EACH ROW
BEGIN
  IF NEW.`status` = 'EFFECTIVE' AND EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    WHERE d.`sopId` = NEW.`sopId`
      AND d.`status` = 'EFFECTIVE'
      AND d.`detailSopId` <> OLD.`detailSopId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hanya satu DetailSOP EFFECTIVE per SOP';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_langkahsop_cabang_detail_insert`;
CREATE TRIGGER `trg_langkahsop_cabang_detail_insert`
BEFORE INSERT ON `LangkahSOP`
FOR EACH ROW
BEGIN
  IF NEW.`langkahSelanjutnyaYaId` IS NOT NULL THEN
    IF (
      SELECT COUNT(*)
      FROM `LangkahSOP` target
      WHERE target.`langkahSopId` = NEW.`langkahSelanjutnyaYaId`
        AND target.`detailSopId` = NEW.`detailSopId`
    ) = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Langkah tujuan cabang Ya harus berada dalam DetailSOP yang sama';
    END IF;
  END IF;

  IF NEW.`langkahSelanjutnyaTidakId` IS NOT NULL THEN
    IF (
      SELECT COUNT(*)
      FROM `LangkahSOP` target
      WHERE target.`langkahSopId` = NEW.`langkahSelanjutnyaTidakId`
        AND target.`detailSopId` = NEW.`detailSopId`
    ) = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Langkah tujuan cabang Tidak harus berada dalam DetailSOP yang sama';
    END IF;
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_langkahsop_cabang_detail_update`;
CREATE TRIGGER `trg_langkahsop_cabang_detail_update`
BEFORE UPDATE ON `LangkahSOP`
FOR EACH ROW
BEGIN
  IF NEW.`langkahSelanjutnyaYaId` IS NOT NULL THEN
    IF (
      SELECT COUNT(*)
      FROM `LangkahSOP` target
      WHERE target.`langkahSopId` = NEW.`langkahSelanjutnyaYaId`
        AND target.`detailSopId` = NEW.`detailSopId`
    ) = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Langkah tujuan cabang Ya harus berada dalam DetailSOP yang sama';
    END IF;
  END IF;

  IF NEW.`langkahSelanjutnyaTidakId` IS NOT NULL THEN
    IF (
      SELECT COUNT(*)
      FROM `LangkahSOP` target
      WHERE target.`langkahSopId` = NEW.`langkahSelanjutnyaTidakId`
        AND target.`detailSopId` = NEW.`detailSopId`
    ) = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Langkah tujuan cabang Tidak harus berada dalam DetailSOP yang sama';
    END IF;
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_langkahsop_pelaksana_swimlane_insert`;
CREATE TRIGGER `trg_langkahsop_pelaksana_swimlane_insert`
BEFORE INSERT ON `LangkahSOP`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM `DetailSOPPelaksana` d
    WHERE d.`detailSopId` = NEW.`detailSopId`
      AND d.`pelaksanaId` = NEW.`pelaksanaId`
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pelaksana langkah harus dipilih sebagai swimlane pada DetailSOP yang sama';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_langkahsop_pelaksana_swimlane_update`;
CREATE TRIGGER `trg_langkahsop_pelaksana_swimlane_update`
BEFORE UPDATE ON `LangkahSOP`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM `DetailSOPPelaksana` d
    WHERE d.`detailSopId` = NEW.`detailSopId`
      AND d.`pelaksanaId` = NEW.`pelaksanaId`
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pelaksana langkah harus dipilih sebagai swimlane pada DetailSOP yang sama';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_scope_department_insert`;
CREATE TRIGGER `trg_process_scope_department_insert`
BEFORE INSERT ON `Process`
FOR EACH ROW
BEGIN
  IF (NEW.`scope` = 'FACULTY' AND NEW.`departmentId` IS NOT NULL)
     OR (NEW.`scope` = 'DEPARTMENT' AND NEW.`departmentId` IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process scope and departmentId are inconsistent';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_scope_department_update`;
CREATE TRIGGER `trg_process_scope_department_update`
BEFORE UPDATE ON `Process`
FOR EACH ROW
BEGIN
  IF (NEW.`scope` = 'FACULTY' AND NEW.`departmentId` IS NOT NULL)
     OR (NEW.`scope` = 'DEPARTMENT' AND NEW.`departmentId` IS NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process scope and departmentId are inconsistent';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_sop_terkait_insert`;
CREATE TRIGGER `trg_sop_terkait_insert`
BEFORE INSERT ON `SopTerkait`
FOR EACH ROW
BEGIN
  IF NEW.`detailSopId` = NEW.`detailSopTerkaitId` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SOP terkait tidak boleh merujuk diri sendiri';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_sop_terkait_update`;
CREATE TRIGGER `trg_sop_terkait_update`
BEFORE UPDATE ON `SopTerkait`
FOR EACH ROW
BEGIN
  IF NEW.`detailSopId` = NEW.`detailSopTerkaitId` THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SOP terkait tidak boleh merujuk diri sendiri';
  END IF;
END;

-- Active workflow versions must be owned by a Process. EFFECTIVE/SUPERSEDED/REVOKED
-- are intentionally excluded so imported archive rows may remain unbound.
DROP TRIGGER IF EXISTS `trg_detailsop_active_process_insert`;
CREATE TRIGGER `trg_detailsop_active_process_insert`
BEFORE INSERT ON `DetailSOP`
FOR EACH ROW
BEGIN
  IF NEW.`status` IN ('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING')
     AND NOT EXISTS (
       SELECT 1
       FROM `SOP` s
       WHERE s.`sopId` = NEW.`sopId`
         AND s.`processId` IS NOT NULL
     ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active DetailSOP harus terikat ke Process';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_detailsop_active_process_update`;
CREATE TRIGGER `trg_detailsop_active_process_update`
BEFORE UPDATE ON `DetailSOP`
FOR EACH ROW
BEGIN
  IF NEW.`status` IN ('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING')
     AND NOT EXISTS (
       SELECT 1
       FROM `SOP` s
       WHERE s.`sopId` = NEW.`sopId`
         AND s.`processId` IS NOT NULL
     ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active DetailSOP harus terikat ke Process';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_sop_active_process_update`;
CREATE TRIGGER `trg_sop_active_process_update`
BEFORE UPDATE ON `SOP`
FOR EACH ROW
BEGIN
  IF NEW.`processId` IS NULL AND EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    WHERE d.`sopId` = OLD.`sopId`
      AND d.`status` IN ('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING')
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process aktif tidak boleh dilepas dari SOP';
  END IF;
END;

-- Review evidence is a valid Process Owner decision on the same SOP/Process.
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
      AND NEW.`nextStatus` = 'FINAL_APPROVAL')
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
      AND NEW.`nextStatus` = 'FINAL_APPROVAL')
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

-- Organizational authority assignment must match its canonical scope key.
DROP TRIGGER IF EXISTS `trg_authority_assignment_contract_insert`;
CREATE TRIGGER `trg_authority_assignment_contract_insert`
BEFORE INSERT ON `OrganizationalAuthorityAssignment`
FOR EACH ROW
BEGIN
  IF NOT (
    (NEW.`authority` = 'DEAN'
      AND NEW.`departmentId` IS NULL
      AND NEW.`authorityKey` = 'DEAN')
    OR
    (NEW.`authority` = 'HEAD_OF_DEPARTMENT'
      AND NEW.`departmentId` IS NOT NULL
      AND NEW.`authorityKey` = CONCAT('HEAD_OF_DEPARTMENT:', NEW.`departmentId`))
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Organizational authority assignment tidak konsisten';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_authority_assignment_contract_update`;
CREATE TRIGGER `trg_authority_assignment_contract_update`
BEFORE UPDATE ON `OrganizationalAuthorityAssignment`
FOR EACH ROW
BEGIN
  IF NOT (
    (NEW.`authority` = 'DEAN'
      AND NEW.`departmentId` IS NULL
      AND NEW.`authorityKey` = 'DEAN')
    OR
    (NEW.`authority` = 'HEAD_OF_DEPARTMENT'
      AND NEW.`departmentId` IS NOT NULL
      AND NEW.`authorityKey` = CONCAT('HEAD_OF_DEPARTMENT:', NEW.`departmentId`))
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Organizational authority assignment tidak konsisten';
  END IF;
END;

-- Final approval must reference an accepted review and the resolved authority for that Process.
DROP TRIGGER IF EXISTS `trg_process_final_approval_contract_insert`;
CREATE TRIGGER `trg_process_final_approval_contract_insert`
BEFORE INSERT ON `ProcessFinalApproval`
FOR EACH ROW
BEGIN
  IF NEW.`processReviewId` IS NULL OR NOT EXISTS (
    SELECT 1
    FROM `ProcessReview` r
    WHERE r.`processReviewId` = NEW.`processReviewId`
      AND r.`detailSopId` = NEW.`detailSopId`
      AND r.`processId` = NEW.`processId`
      AND r.`decision` = 'ACCEPT'
      AND r.`previousStatus` = 'PROCESS_REVIEW'
      AND r.`nextStatus` = 'FINAL_APPROVAL'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Final approval harus merujuk ProcessReview ACCEPT yang sama';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM `OrganizationalAuthorityAssignment` a
    JOIN `Process` p ON p.`processId` = NEW.`processId`
    WHERE a.`authorityKey` = NEW.`authorityKey`
      AND a.`authority` = NEW.`authority`
      AND a.`holderId` = NEW.`approvedById`
      AND (
        (p.`scope` = 'FACULTY'
          AND p.`departmentId` IS NULL
          AND NEW.`authority` = 'DEAN'
          AND a.`departmentId` IS NULL
          AND a.`authorityKey` = 'DEAN')
        OR
        (p.`scope` = 'DEPARTMENT'
          AND p.`departmentId` IS NOT NULL
          AND NEW.`authority` = 'HEAD_OF_DEPARTMENT'
          AND a.`departmentId` = p.`departmentId`
          AND a.`authorityKey` = CONCAT('HEAD_OF_DEPARTMENT:', p.`departmentId`))
      )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Final approval authority tidak sesuai Process';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_final_approval_contract_update`;
CREATE TRIGGER `trg_process_final_approval_contract_update`
BEFORE UPDATE ON `ProcessFinalApproval`
FOR EACH ROW
BEGIN
  IF NEW.`processReviewId` IS NULL OR NOT EXISTS (
    SELECT 1
    FROM `ProcessReview` r
    WHERE r.`processReviewId` = NEW.`processReviewId`
      AND r.`detailSopId` = NEW.`detailSopId`
      AND r.`processId` = NEW.`processId`
      AND r.`decision` = 'ACCEPT'
      AND r.`previousStatus` = 'PROCESS_REVIEW'
      AND r.`nextStatus` = 'FINAL_APPROVAL'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Final approval harus merujuk ProcessReview ACCEPT yang sama';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM `OrganizationalAuthorityAssignment` a
    JOIN `Process` p ON p.`processId` = NEW.`processId`
    WHERE a.`authorityKey` = NEW.`authorityKey`
      AND a.`authority` = NEW.`authority`
      AND a.`holderId` = NEW.`approvedById`
      AND (
        (p.`scope` = 'FACULTY'
          AND p.`departmentId` IS NULL
          AND NEW.`authority` = 'DEAN'
          AND a.`departmentId` IS NULL
          AND a.`authorityKey` = 'DEAN')
        OR
        (p.`scope` = 'DEPARTMENT'
          AND p.`departmentId` IS NOT NULL
          AND NEW.`authority` = 'HEAD_OF_DEPARTMENT'
          AND a.`departmentId` = p.`departmentId`
          AND a.`authorityKey` = CONCAT('HEAD_OF_DEPARTMENT:', p.`departmentId`))
      )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Final approval authority tidak sesuai Process';
  END IF;
END;

-- A TTE document must belong to the same Process as its DetailSOP -> SOP ownership chain.
DROP TRIGGER IF EXISTS `trg_dokumen_tte_process_contract_insert`;
CREATE TRIGGER `trg_dokumen_tte_process_contract_insert`
BEFORE INSERT ON `DokumenTte`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    JOIN `SOP` s ON s.`sopId` = d.`sopId`
    WHERE d.`detailSopId` = NEW.`detailSopId`
      AND s.`processId` = NEW.`processId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DokumenTte processId harus sama dengan Process pemilik SOP';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_dokumen_tte_process_contract_update`;
CREATE TRIGGER `trg_dokumen_tte_process_contract_update`
BEFORE UPDATE ON `DokumenTte`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM `DetailSOP` d
    JOIN `SOP` s ON s.`sopId` = d.`sopId`
    WHERE d.`detailSopId` = NEW.`detailSopId`
      AND s.`processId` = NEW.`processId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DokumenTte processId harus sama dengan Process pemilik SOP';
  END IF;
END;
