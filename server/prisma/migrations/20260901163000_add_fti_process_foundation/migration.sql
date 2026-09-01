-- Sprint 2 expand migration: add FTI platform/process ownership without removing legacy OPD workflow.

ALTER TABLE `Pengguna`
  ADD COLUMN `platformRole` ENUM('SUPER_ADMIN', 'USER') NOT NULL DEFAULT 'USER' AFTER `peran`,
  ADD INDEX `Pengguna_platformRole_deletedAt_idx` (`platformRole`, `deletedAt`);

CREATE TABLE `Department` (
  `departmentId` CHAR(36) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`departmentId`),
  UNIQUE INDEX `Department_nama_key` (`nama`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Process` (
  `processId` CHAR(36) NOT NULL,
  `nama` VARCHAR(120) NOT NULL,
  `scope` ENUM('FACULTY', 'DEPARTMENT') NOT NULL,
  `departmentId` CHAR(36) NULL,
  `ownerId` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`processId`),
  INDEX `Process_scope_departmentId_idx` (`scope`, `departmentId`),
  INDEX `Process_ownerId_idx` (`ownerId`),
  CONSTRAINT `Process_scope_department_check`
    CHECK ((`scope` = 'FACULTY' AND `departmentId` IS NULL) OR (`scope` = 'DEPARTMENT' AND `departmentId` IS NOT NULL)),
  CONSTRAINT `Process_departmentId_fkey`
    FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Process_ownerId_fkey`
    FOREIGN KEY (`ownerId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProcessMember` (
  `processId` CHAR(36) NOT NULL,
  `penggunaId` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`processId`, `penggunaId`),
  INDEX `ProcessMember_penggunaId_idx` (`penggunaId`),
  CONSTRAINT `ProcessMember_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProcessMember_penggunaId_fkey`
    FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
