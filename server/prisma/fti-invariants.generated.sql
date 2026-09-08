-- FTI-native database invariants that are not expressible in Prisma schema.

-- Normalize DetailSOP trigger state without depending on superseded trigger names.
SET @detailsop_trigger_name = (
  SELECT TRIGGER_NAME
  FROM information_schema.TRIGGERS
  WHERE TRIGGER_SCHEMA = DATABASE()
    AND LOWER(EVENT_OBJECT_TABLE) = 'detailsop'
  ORDER BY TRIGGER_NAME
  LIMIT 1
);
SET @drop_detailsop_trigger_sql = IF(
  @detailsop_trigger_name IS NULL,
  'SELECT 1',
  CONCAT('DROP TRIGGER `', REPLACE(@detailsop_trigger_name, '`', '``'), '`')
);
PREPARE drop_detailsop_trigger_stmt FROM @drop_detailsop_trigger_sql;
EXECUTE drop_detailsop_trigger_stmt;
DEALLOCATE PREPARE drop_detailsop_trigger_stmt;

SET @detailsop_trigger_name = (
  SELECT TRIGGER_NAME
  FROM information_schema.TRIGGERS
  WHERE TRIGGER_SCHEMA = DATABASE()
    AND LOWER(EVENT_OBJECT_TABLE) = 'detailsop'
  ORDER BY TRIGGER_NAME
  LIMIT 1
);
SET @drop_detailsop_trigger_sql = IF(
  @detailsop_trigger_name IS NULL,
  'SELECT 1',
  CONCAT('DROP TRIGGER `', REPLACE(@detailsop_trigger_name, '`', '``'), '`')
);
PREPARE drop_detailsop_trigger_stmt FROM @drop_detailsop_trigger_sql;
EXECUTE drop_detailsop_trigger_stmt;
DEALLOCATE PREPARE drop_detailsop_trigger_stmt;

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
