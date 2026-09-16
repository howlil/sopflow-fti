-- A Process Owner account has one active organizational scope at a time.
-- Historical revoked assignments remain available as audit history.

DROP TRIGGER IF EXISTS `trg_process_owner_authority_one_scope_insert`;
CREATE TRIGGER `trg_process_owner_authority_one_scope_insert`
BEFORE INSERT ON `ProcessOwnerAuthority`
FOR EACH ROW
BEGIN
  IF NEW.`revokedAt` IS NULL AND EXISTS (
    SELECT 1
    FROM `ProcessOwnerAuthority` a
      WHERE a.`penggunaId` = NEW.`penggunaId`
      AND a.`revokedAt` IS NULL
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Satu akun hanya boleh memiliki satu lingkup owner aktif';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_owner_authority_one_scope_update`;
CREATE TRIGGER `trg_process_owner_authority_one_scope_update`
BEFORE UPDATE ON `ProcessOwnerAuthority`
FOR EACH ROW
BEGIN
  IF NEW.`revokedAt` IS NULL AND EXISTS (
    SELECT 1
    FROM `ProcessOwnerAuthority` a
      WHERE a.`penggunaId` = NEW.`penggunaId`
      AND a.`revokedAt` IS NULL
      AND a.`processOwnerAuthorityId` <> NEW.`processOwnerAuthorityId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Satu akun hanya boleh memiliki satu lingkup owner aktif';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_owner_scope_insert`;
CREATE TRIGGER `trg_process_owner_scope_insert`
BEFORE INSERT ON `Process`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM `ProcessOwnerAuthority` a
    WHERE a.`penggunaId` = NEW.`ownerId`
      AND a.`revokedAt` IS NULL
      AND (
        (NEW.`scope` = 'FACULTY'
          AND NEW.`departmentId` IS NULL
          AND a.`scope` = 'FACULTY'
          AND a.`departmentId` IS NULL)
        OR
        (NEW.`scope` = 'DEPARTMENT'
          AND NEW.`departmentId` IS NOT NULL
          AND a.`scope` = 'DEPARTMENT'
          AND a.`departmentId` = NEW.`departmentId`)
      )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process owner tidak memiliki kewenangan pada lingkup Process ini';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_owner_scope_update`;
CREATE TRIGGER `trg_process_owner_scope_update`
BEFORE UPDATE ON `Process`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM `ProcessOwnerAuthority` a
    WHERE a.`penggunaId` = NEW.`ownerId`
      AND a.`revokedAt` IS NULL
      AND (
        (NEW.`scope` = 'FACULTY'
          AND NEW.`departmentId` IS NULL
          AND a.`scope` = 'FACULTY'
          AND a.`departmentId` IS NULL)
        OR
        (NEW.`scope` = 'DEPARTMENT'
          AND NEW.`departmentId` IS NOT NULL
          AND a.`scope` = 'DEPARTMENT'
          AND a.`departmentId` = NEW.`departmentId`)
      )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process owner tidak memiliki kewenangan pada lingkup Process ini';
  END IF;
END;
