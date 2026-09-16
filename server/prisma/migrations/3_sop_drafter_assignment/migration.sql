-- Penanggung Jawab Proses Bisnis may assign one primary Penyusun to an SOP.
-- Assignment is coordination metadata, not authoring ACL. Authoring authorization
-- remains derived from ProcessMember in application services.

CREATE TABLE `SopDrafterAssignment` (
  `sopId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `penyusunId` CHAR(36) NOT NULL,
  `assignedById` CHAR(36) NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`sopId`),
  INDEX `SopDrafterAssignment_process_drafter_idx` (`processId`, `penyusunId`),
  INDEX `SopDrafterAssignment_assigner_assigned_idx` (`assignedById`, `assignedAt`),
  CONSTRAINT `SopDrafterAssignment_sopId_fkey`
    FOREIGN KEY (`sopId`) REFERENCES `SOP` (`sopId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SopDrafterAssignment_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process` (`processId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SopDrafterAssignment_penyusunId_fkey`
    FOREIGN KEY (`penyusunId`) REFERENCES `Pengguna` (`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SopDrafterAssignment_assignedById_fkey`
    FOREIGN KEY (`assignedById`) REFERENCES `Pengguna` (`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TRIGGER IF EXISTS `trg_sop_drafter_assignment_insert`;
CREATE TRIGGER `trg_sop_drafter_assignment_insert`
BEFORE INSERT ON `SopDrafterAssignment`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM `SOP` s
    WHERE s.`sopId` = NEW.`sopId` AND s.`processId` = NEW.`processId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penugasan Penyusun harus menggunakan Proses Bisnis pemilik SOP';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM `ProcessMember` pm
    WHERE pm.`processId` = NEW.`processId` AND pm.`penggunaId` = NEW.`penyusunId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penyusun yang ditugaskan harus Anggota Proses Bisnis';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM `Process` p
    WHERE p.`processId` = NEW.`processId` AND p.`ownerId` = NEW.`assignedById`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penugasan Penyusun hanya dapat dilakukan Penanggung Jawab Proses Bisnis';
  END IF;
END;

DROP TRIGGER IF EXISTS `trg_sop_drafter_assignment_update`;
CREATE TRIGGER `trg_sop_drafter_assignment_update`
BEFORE UPDATE ON `SopDrafterAssignment`
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM `SOP` s
    WHERE s.`sopId` = NEW.`sopId` AND s.`processId` = NEW.`processId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penugasan Penyusun harus menggunakan Proses Bisnis pemilik SOP';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM `ProcessMember` pm
    WHERE pm.`processId` = NEW.`processId` AND pm.`penggunaId` = NEW.`penyusunId`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penyusun yang ditugaskan harus Anggota Proses Bisnis';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM `Process` p
    WHERE p.`processId` = NEW.`processId` AND p.`ownerId` = NEW.`assignedById`
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penugasan Penyusun hanya dapat dilakukan Penanggung Jawab Proses Bisnis';
  END IF;
END;
