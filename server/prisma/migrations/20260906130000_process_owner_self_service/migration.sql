CREATE TABLE `ProcessOwnerAuthority` (
  `processOwnerAuthorityId` CHAR(36) NOT NULL,
  `penggunaId` CHAR(36) NOT NULL,
  `scope` ENUM('FACULTY', 'DEPARTMENT') NOT NULL,
  `departmentId` CHAR(36) NULL,
  `scopeKey` VARCHAR(64) NOT NULL,
  `grantedById` CHAR(36) NOT NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`processOwnerAuthorityId`),
  UNIQUE INDEX `ProcessOwnerAuthority_user_scopeKey_key` (`penggunaId`, `scopeKey`),
  INDEX `ProcessOwnerAuthority_scope_active_idx` (`scope`, `departmentId`, `revokedAt`),
  INDEX `ProcessOwnerAuthority_granter_created_idx` (`grantedById`, `createdAt`),
  CONSTRAINT `ProcessOwnerAuthority_penggunaId_fkey`
    FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessOwnerAuthority_departmentId_fkey`
    FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessOwnerAuthority_grantedById_fkey`
    FOREIGN KEY (`grantedById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProcessLifecycle` (
  `processId` CHAR(36) NOT NULL,
  `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `archivedAt` DATETIME(3) NULL,
  `archivedReason` VARCHAR(255) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`processId`),
  INDEX `ProcessLifecycle_status_updated_idx` (`status`, `updatedAt`),
  CONSTRAINT `ProcessLifecycle_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ProcessLifecycle` (`processId`, `status`, `archivedAt`, `archivedReason`, `updatedAt`)
SELECT `processId`, 'ACTIVE', NULL, NULL, CURRENT_TIMESTAMP(3)
FROM `Process`;

CREATE TABLE `ProcessInvitation` (
  `processInvitationId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `email` VARCHAR(31) NOT NULL,
  `nama` VARCHAR(31) NOT NULL,
  `nip` CHAR(18) NOT NULL,
  `jabatan` VARCHAR(28) NOT NULL,
  `pangkat` VARCHAR(25) NOT NULL,
  `nohp` VARCHAR(13) NOT NULL,
  `tokenHash` CHAR(64) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `invitedById` CHAR(36) NOT NULL,
  `acceptedById` CHAR(36) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `acceptedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`processInvitationId`),
  UNIQUE INDEX `ProcessInvitation_tokenHash_key` (`tokenHash`),
  INDEX `ProcessInvitation_process_status_idx` (`processId`, `status`),
  INDEX `ProcessInvitation_email_status_idx` (`email`, `status`),
  INDEX `ProcessInvitation_inviter_created_idx` (`invitedById`, `createdAt`),
  CONSTRAINT `ProcessInvitation_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProcessInvitation_invitedById_fkey`
    FOREIGN KEY (`invitedById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessInvitation_acceptedById_fkey`
    FOREIGN KEY (`acceptedById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProcessAudit` (
  `processAuditId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NULL,
  `actorId` CHAR(36) NOT NULL,
  `event` ENUM(
    'OWNER_AUTHORITY_GRANTED',
    'OWNER_AUTHORITY_REVOKED',
    'PROCESS_CREATED',
    'PROCESS_RENAMED',
    'PROCESS_ARCHIVED',
    'MEMBER_ADDED',
    'MEMBER_REMOVED',
    'INVITATION_CREATED',
    'INVITATION_ACCEPTED'
  ) NOT NULL,
  `targetUserId` CHAR(36) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`processAuditId`),
  INDEX `ProcessAudit_process_created_idx` (`processId`, `createdAt`),
  INDEX `ProcessAudit_actor_created_idx` (`actorId`, `createdAt`),
  INDEX `ProcessAudit_target_created_idx` (`targetUserId`, `createdAt`),
  CONSTRAINT `ProcessAudit_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ProcessAudit_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessAudit_targetUserId_fkey`
    FOREIGN KEY (`targetUserId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
