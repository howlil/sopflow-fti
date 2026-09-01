-- Sprint 7: contextual final-approval authority and approval audit evidence.
-- Final approval is intentionally separated from TTE/BERLAKU.

CREATE TABLE `OrganizationalAuthorityAssignment` (
  `authorityKey` VARCHAR(64) NOT NULL,
  `authority` ENUM('DEAN', 'HEAD_OF_DEPARTMENT') NOT NULL,
  `departmentId` CHAR(36) NULL,
  `holderId` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`authorityKey`),
  INDEX `OrganizationalAuthorityAssignment_authority_departmentId_idx` (`authority`, `departmentId`),
  INDEX `OrganizationalAuthorityAssignment_holderId_idx` (`holderId`),
  CONSTRAINT `OrganizationalAuthorityAssignment_departmentId_fkey`
    FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrganizationalAuthorityAssignment_holderId_fkey`
    FOREIGN KEY (`holderId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProcessFinalApproval` (
  `detailSopId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `approvedById` CHAR(36) NOT NULL,
  `authority` ENUM('DEAN', 'HEAD_OF_DEPARTMENT') NOT NULL,
  `authorityKey` VARCHAR(64) NOT NULL,
  `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`detailSopId`),
  INDEX `ProcessFinalApproval_processId_approvedAt_idx` (`processId`, `approvedAt`),
  INDEX `ProcessFinalApproval_approvedById_approvedAt_idx` (`approvedById`, `approvedAt`),
  INDEX `ProcessFinalApproval_authorityKey_idx` (`authorityKey`),
  CONSTRAINT `ProcessFinalApproval_detailSopId_fkey`
    FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessFinalApproval_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessFinalApproval_approvedById_fkey`
    FOREIGN KEY (`approvedById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessFinalApproval_authorityKey_fkey`
    FOREIGN KEY (`authorityKey`) REFERENCES `OrganizationalAuthorityAssignment`(`authorityKey`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
