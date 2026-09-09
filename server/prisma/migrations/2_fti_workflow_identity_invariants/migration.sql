-- PlatformRole is platform administration only. Workflow relationships must use
-- active USER identities; SUPER_ADMIN must never become an owner, member, or
-- contextual approval authority through a direct database write.

DROP TRIGGER IF EXISTS `trg_process_owner_identity_insert`;
CREATE TRIGGER `trg_process_owner_identity_insert`
BEFORE INSERT ON `Process`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`ownerId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process owner harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_owner_identity_update`;
CREATE TRIGGER `trg_process_owner_identity_update`
BEFORE UPDATE ON `Process`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`ownerId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process owner harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_member_identity_insert`;
CREATE TRIGGER `trg_process_member_identity_insert`
BEFORE INSERT ON `ProcessMember`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`penggunaId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process member harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_member_identity_update`;
CREATE TRIGGER `trg_process_member_identity_update`
BEFORE UPDATE ON `ProcessMember`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`penggunaId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process member harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_authority_holder_identity_insert`;
CREATE TRIGGER `trg_authority_holder_identity_insert`
BEFORE INSERT ON `OrganizationalAuthorityAssignment`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`holderId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Authority holder harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_authority_holder_identity_update`;
CREATE TRIGGER `trg_authority_holder_identity_update`
BEFORE UPDATE ON `OrganizationalAuthorityAssignment`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`holderId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Authority holder harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_owner_authority_identity_insert`;
CREATE TRIGGER `trg_process_owner_authority_identity_insert`
BEFORE INSERT ON `ProcessOwnerAuthority`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`penggunaId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process owner authority harus pengguna workflow USER';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_process_owner_authority_identity_update`;
CREATE TRIGGER `trg_process_owner_authority_identity_update`
BEFORE UPDATE ON `ProcessOwnerAuthority`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `Pengguna` u
    WHERE u.`penggunaId` = NEW.`penggunaId`
      AND u.`platformRole` <> 'USER'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Process owner authority harus pengguna workflow USER';
  END IF;
END;
