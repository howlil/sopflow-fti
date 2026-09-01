-- Sprint 3 expand migration: bind target-authoring SOPs to Process without dropping legacy SOP.opdId.

CREATE TABLE `ProcessSopBinding` (
  `sopId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `createdById` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`sopId`),
  INDEX `ProcessSopBinding_processId_idx` (`processId`),
  INDEX `ProcessSopBinding_createdById_idx` (`createdById`),
  CONSTRAINT `ProcessSopBinding_sopId_fkey`
    FOREIGN KEY (`sopId`) REFERENCES `SOP`(`sopId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProcessSopBinding_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessSopBinding_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
