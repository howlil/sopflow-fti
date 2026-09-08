-- CreateTable
CREATE TABLE `Pengguna` (
    `penggunaId` CHAR(36) NOT NULL,
    `email` VARCHAR(31) NOT NULL,
    `nama` VARCHAR(31) NOT NULL,
    `kataSandi` CHAR(60) NOT NULL,
    `platformRole` ENUM('SUPER_ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `nip` CHAR(18) NOT NULL,
    `jabatan` VARCHAR(28) NOT NULL,
    `pangkat` VARCHAR(25) NOT NULL,
    `nohp` VARCHAR(13) NOT NULL,
    `sesiTokenVersion` INTEGER NOT NULL DEFAULT 0,
    `refreshTokenHash` CHAR(60) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `passwordChangedAt` DATETIME(3) NULL,
    `ttePinHash` CHAR(60) NULL,
    `tteP12Base64` TEXT NULL,
    `tteP12PassphraseEncrypted` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pengguna_email_key`(`email`),
    UNIQUE INDEX `Pengguna_nip_key`(`nip`),
    INDEX `Pengguna_platformRole_deletedAt_idx`(`platformRole`, `deletedAt`),
    PRIMARY KEY (`penggunaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `departmentId` CHAR(36) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Department_nama_key`(`nama`),
    PRIMARY KEY (`departmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Process` (
    `processId` CHAR(36) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `scope` ENUM('FACULTY', 'DEPARTMENT') NOT NULL,
    `departmentId` CHAR(36) NULL,
    `ownerId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Process_scope_departmentId_idx`(`scope`, `departmentId`),
    INDEX `Process_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`processId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessMember` (
    `processId` CHAR(36) NOT NULL,
    `penggunaId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProcessMember_penggunaId_idx`(`penggunaId`),
    PRIMARY KEY (`processId`, `penggunaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Peraturan` (
    `peraturanId` CHAR(36) NOT NULL,
    `nama` VARCHAR(31) NOT NULL,
    `nomor` VARCHAR(28) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `tentang` VARCHAR(73) NOT NULL,
    `lastEditedById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Peraturan_lastEditedById_idx`(`lastEditedById`),
    UNIQUE INDEX `Peraturan_nomor_tahun_key`(`nomor`, `tahun`),
    PRIMARY KEY (`peraturanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SOP` (
    `sopId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NULL,
    `judul` VARCHAR(42) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SOP_processId_idx`(`processId`),
    PRIMARY KEY (`sopId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetailSOP` (
    `detailSopId` CHAR(36) NOT NULL,
    `sopId` CHAR(36) NOT NULL,
    `status` ENUM('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING', 'EFFECTIVE', 'SUPERSEDED', 'REVOKED') NOT NULL DEFAULT 'DRAFT',
    `versi` INTEGER NOT NULL DEFAULT 1,
    `nomorSOP` VARCHAR(24) NOT NULL,
    `tanggalPembuatan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggalRevisi` DATETIME(3) NULL,
    `tanggalEfektif` DATETIME(3) NULL,
    `namaLembaga` VARCHAR(28) NOT NULL,
    `dibuatOlehId` CHAR(36) NULL,
    `terakhirDieditOlehId` CHAR(36) NULL,
    `revisiDariDetailSopId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DetailSOP_nomorSOP_key`(`nomorSOP`),
    INDEX `DetailSOP_sopId_status_idx`(`sopId`, `status`),
    INDEX `DetailSOP_sopId_status_versi_idx`(`sopId`, `status`, `versi`),
    INDEX `DetailSOP_status_updatedAt_idx`(`status`, `updatedAt`),
    INDEX `DetailSOP_status_tanggalEfektif_idx`(`status`, `tanggalEfektif`),
    INDEX `DetailSOP_revisiDariDetailSopId_idx`(`revisiDariDetailSopId`),
    UNIQUE INDEX `DetailSOP_sopId_versi_key`(`sopId`, `versi`),
    PRIMARY KEY (`detailSopId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LampiranPeringatan` (
    `lampiranPeringatanId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `teks` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LampiranPeringatan_detailSopId_idx`(`detailSopId`),
    PRIMARY KEY (`lampiranPeringatanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LampiranKualifikasiPelaksanaan` (
    `lampiranKualifikasiPelaksanaanId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `teks` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LampiranKualifikasiPelaksanaan_detailSopId_idx`(`detailSopId`),
    PRIMARY KEY (`lampiranKualifikasiPelaksanaanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LampiranPeralatanPerlengkapan` (
    `lampiranPeralatanPerlengkapanId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `teks` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LampiranPeralatanPerlengkapan_detailSopId_idx`(`detailSopId`),
    PRIMARY KEY (`lampiranPeralatanPerlengkapanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LampiranPencatatanPendataan` (
    `lampiranPencatatanPendataanId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `teks` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LampiranPencatatanPendataan_detailSopId_idx`(`detailSopId`),
    PRIMARY KEY (`lampiranPencatatanPendataanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DasarHukum` (
    `detailSopId` CHAR(36) NOT NULL,
    `peraturanId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DasarHukum_peraturanId_idx`(`peraturanId`),
    PRIMARY KEY (`detailSopId`, `peraturanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SopTerkait` (
    `detailSopId` CHAR(36) NOT NULL,
    `detailSopTerkaitId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SopTerkait_detailSopTerkaitId_idx`(`detailSopTerkaitId`),
    PRIMARY KEY (`detailSopId`, `detailSopTerkaitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LangkahSOP` (
    `langkahSopId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `kegiatan` VARCHAR(55) NOT NULL,
    `jenis` ENUM('AWAL_AKHIR', 'KEGIATAN', 'KEPUTUSAN') NOT NULL DEFAULT 'KEGIATAN',
    `urutan` INTEGER NOT NULL,
    `kelengkapan` VARCHAR(34) NOT NULL,
    `keluaran` VARCHAR(23) NOT NULL,
    `waktu` INTEGER NOT NULL,
    `satuanWaktu` ENUM('m', 'h', 'd', 'w', 'mo', 'y') NOT NULL,
    `keterangan` VARCHAR(37) NOT NULL,
    `pelaksanaId` CHAR(36) NOT NULL,
    `langkahSelanjutnyaYaId` CHAR(36) NULL,
    `langkahSelanjutnyaTidakId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LangkahSOP_pelaksanaId_idx`(`pelaksanaId`),
    INDEX `LangkahSOP_langkahSelanjutnyaYaId_idx`(`langkahSelanjutnyaYaId`),
    INDEX `LangkahSOP_langkahSelanjutnyaTidakId_idx`(`langkahSelanjutnyaTidakId`),
    UNIQUE INDEX `LangkahSOP_detailSopId_urutan_key`(`detailSopId`, `urutan`),
    PRIMARY KEY (`langkahSopId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pelaksana` (
    `pelaksanaId` CHAR(36) NOT NULL,
    `nama` VARCHAR(15) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pelaksana_nama_key`(`nama`),
    PRIMARY KEY (`pelaksanaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetailSOPPelaksana` (
    `detailSopId` CHAR(36) NOT NULL,
    `pelaksanaId` CHAR(36) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DetailSOPPelaksana_pelaksanaId_idx`(`pelaksanaId`),
    PRIMARY KEY (`detailSopId`, `pelaksanaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogEditSOP` (
    `detailSopId` CHAR(36) NOT NULL,
    `penggunaId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bagian` ENUM('HEADER', 'LANGKAH', 'STATUS', 'UMPAN_BALIK', 'REVIEW') NOT NULL DEFAULT 'HEADER',
    `keterangan` TEXT NULL,
    `sesiChangeCount` INTEGER NOT NULL DEFAULT 1,
    `closedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LogEditSOP_detailSopId_penggunaId_bagian_closedAt_idx`(`detailSopId`, `penggunaId`, `bagian`, `closedAt`),
    INDEX `LogEditSOP_detailSopId_createdAt_idx`(`detailSopId`, `createdAt`),
    PRIMARY KEY (`detailSopId`, `penggunaId`, `createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogEditSopDomainField` (
    `detailSopId` CHAR(36) NOT NULL,
    `penggunaId` CHAR(36) NOT NULL,
    `logCreatedAt` DATETIME(3) NOT NULL,
    `domainField` VARCHAR(22) NOT NULL,

    PRIMARY KEY (`detailSopId`, `penggunaId`, `logCreatedAt`, `domainField`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DokumenTte` (
    `dokumenTteId` CHAR(36) NOT NULL,
    `nomorDokumen` VARCHAR(756) NOT NULL,
    `jenisDokumen` ENUM('SOP_BERLAKU') NOT NULL DEFAULT 'SOP_BERLAKU',
    `judulDokumen` VARCHAR(2503) NOT NULL,
    `hashDokumen` CHAR(64) NOT NULL,
    `versiDokumen` INTEGER NOT NULL DEFAULT 1,
    `pdfPath` TEXT NULL,
    `pdfSha256` CHAR(64) NULL,
    `pdfSizeBytes` INTEGER NULL,
    `pdfGeneratedAt` DATETIME(3) NULL,
    `pdfPublishedAt` DATETIME(3) NULL,
    `pdfRevokedAt` DATETIME(3) NULL,
    `pdfStatus` VARCHAR(32) NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DokumenTte_nomorDokumen_key`(`nomorDokumen`),
    UNIQUE INDEX `DokumenTte_detailSopId_key`(`detailSopId`),
    INDEX `DokumenTte_jenisDokumen_createdAt_idx`(`jenisDokumen`, `createdAt`),
    INDEX `DokumenTte_jenisDokumen_pdfStatus_idx`(`jenisDokumen`, `pdfStatus`),
    INDEX `DokumenTte_prosesBisnisId_idx`(`processId`),
    PRIMARY KEY (`dokumenTteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiwayatTandaTangan` (
    `userId` CHAR(36) NOT NULL,
    `dokumenTteId` CHAR(36) NOT NULL,
    `authority` ENUM('DEAN', 'HEAD_OF_DEPARTMENT') NOT NULL,
    `signatureValue` LONGTEXT NULL,
    `signatureAlgorithm` VARCHAR(13) NULL,
    `signatureFormat` VARCHAR(14) NULL,
    `certSerialNumber` VARCHAR(40) NULL,
    `certIssuer` TEXT NULL,
    `certSubject` TEXT NULL,
    `certFingerprint` CHAR(64) NULL,
    `certValidFrom` DATETIME(3) NULL,
    `certValidTo` DATETIME(3) NULL,
    `ditandatanganiPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RiwayatTandaTangan_dokumenTteId_authority_key`(`dokumenTteId`, `authority`),
    PRIMARY KEY (`userId`, `dokumenTteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KonfigurasiDiagramSOP` (
    `detailSopId` CHAR(36) NOT NULL,
    `jenis` ENUM('FLOWCHART', 'BPMN') NOT NULL,
    `layoutSeed` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KonfigurasiDiagramSOP_detailSopId_idx`(`detailSopId`),
    PRIMARY KEY (`detailSopId`, `jenis`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OverridePanahDiagramSOP` (
    `detailSopId` CHAR(36) NOT NULL,
    `jenis` ENUM('FLOWCHART', 'BPMN') NOT NULL,
    `dariLangkahSopId` CHAR(36) NOT NULL,
    `keLangkahSopId` CHAR(36) NOT NULL,
    `cabang` ENUM('UTAMA', 'YA', 'TIDAK') NOT NULL,
    `sSide` ENUM('top', 'bottom', 'left', 'right') NOT NULL,
    `eSide` ENUM('top', 'bottom', 'left', 'right') NOT NULL,
    `startX` DOUBLE NOT NULL,
    `startY` DOUBLE NOT NULL,
    `endX` DOUBLE NOT NULL,
    `endY` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OverridePanahDiagramSOP_dariLangkahSopId_idx`(`dariLangkahSopId`),
    INDEX `OverridePanahDiagramSOP_keLangkahSopId_idx`(`keLangkahSopId`),
    PRIMARY KEY (`detailSopId`, `jenis`, `dariLangkahSopId`, `keLangkahSopId`, `cabang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TitikTekukPanahDiagramSOP` (
    `detailSopId` CHAR(36) NOT NULL,
    `jenis` ENUM('FLOWCHART', 'BPMN') NOT NULL,
    `dariLangkahSopId` CHAR(36) NOT NULL,
    `keLangkahSopId` CHAR(36) NOT NULL,
    `cabang` ENUM('UTAMA', 'YA', 'TIDAK') NOT NULL,
    `urutan` INTEGER NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,

    PRIMARY KEY (`detailSopId`, `jenis`, `dariLangkahSopId`, `keLangkahSopId`, `cabang`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OverrideLabelDiagramSOP` (
    `detailSopId` CHAR(36) NOT NULL,
    `jenis` ENUM('FLOWCHART', 'BPMN') NOT NULL,
    `kunciLabel` VARCHAR(8) NOT NULL,
    `posisiX` DOUBLE NOT NULL,
    `posisiY` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`detailSopId`, `jenis`, `kunciLabel`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationalAuthorityAssignment` (
    `authorityKey` VARCHAR(64) NOT NULL,
    `authority` ENUM('DEAN', 'HEAD_OF_DEPARTMENT') NOT NULL,
    `departmentId` CHAR(36) NULL,
    `holderId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrganizationalAuthorityAssignment_authority_departmentId_idx`(`authority`, `departmentId`),
    INDEX `OrganizationalAuthorityAssignment_holderId_idx`(`holderId`),
    PRIMARY KEY (`authorityKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessFinalApproval` (
    `detailSopId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NOT NULL,
    `approvedById` CHAR(36) NOT NULL,
    `processReviewId` CHAR(36) NULL,
    `authority` ENUM('DEAN', 'HEAD_OF_DEPARTMENT') NOT NULL,
    `authorityKey` VARCHAR(64) NOT NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProcessFinalApproval_processId_approvedAt_idx`(`processId`, `approvedAt`),
    INDEX `ProcessFinalApproval_approvedById_approvedAt_idx`(`approvedById`, `approvedAt`),
    INDEX `ProcessFinalApproval_authorityKey_idx`(`authorityKey`),
    INDEX `ProcessFinalApproval_processReviewId_idx`(`processReviewId`),
    PRIMARY KEY (`detailSopId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessReview` (
    `processReviewId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `sopId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NOT NULL,
    `reviewedById` CHAR(36) NOT NULL,
    `decision` ENUM('REVISION', 'ACCEPT') NOT NULL,
    `catatan` TEXT NULL,
    `previousStatus` ENUM('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING', 'EFFECTIVE', 'SUPERSEDED', 'REVOKED') NOT NULL,
    `nextStatus` ENUM('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING', 'EFFECTIVE', 'SUPERSEDED', 'REVOKED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProcessReview_detail_created_idx`(`detailSopId`, `createdAt`),
    INDEX `ProcessReview_process_created_idx`(`processId`, `createdAt`),
    INDEX `ProcessReview_reviewer_created_idx`(`reviewedById`, `createdAt`),
    PRIMARY KEY (`processReviewId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessNotification` (
    `processNotificationId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `sopId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NOT NULL,
    `penggunaId` CHAR(36) NOT NULL,
    `kind` ENUM('PROCESS_OWNER_REVIEW_REQUESTED', 'FINAL_APPROVAL_REQUESTED', 'PROCESS_REVISION_REQUESTED', 'PROCESS_SOP_EFFECTIVE', 'PROCESS_SOP_REVOKED') NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `preview` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `actionHref` VARCHAR(255) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProcessNotification_pengguna_read_created_idx`(`penggunaId`, `readAt`, `createdAt`),
    INDEX `ProcessNotification_detail_created_idx`(`detailSopId`, `createdAt`),
    INDEX `ProcessNotification_process_created_idx`(`processId`, `createdAt`),
    PRIMARY KEY (`processNotificationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessReminder` (
    `processReminderId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `sopId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NOT NULL,
    `penggunaId` CHAR(36) NOT NULL,
    `kind` ENUM('PROCESS_OWNER_REVIEW', 'PROCESS_REVISION', 'FINAL_APPROVAL', 'TTE') NOT NULL,
    `destinationPhone` VARCHAR(13) NOT NULL,
    `nextSendAt` DATETIME(3) NOT NULL,
    `lastSentAt` DATETIME(3) NULL,
    `consecutiveFailures` INTEGER NOT NULL DEFAULT 0,
    `lastErrorKind` VARCHAR(64) NULL,
    `lockedUntil` DATETIME(3) NULL,
    `lockToken` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessReminder_due_lock_idx`(`nextSendAt`, `lockedUntil`),
    INDEX `ProcessReminder_process_created_idx`(`processId`, `createdAt`),
    INDEX `ProcessReminder_recipient_created_idx`(`penggunaId`, `createdAt`),
    UNIQUE INDEX `ProcessReminder_detail_recipient_kind_key`(`detailSopId`, `penggunaId`, `kind`),
    PRIMARY KEY (`processReminderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

    INDEX `ProcessOwnerAuthority_scope_active_idx`(`scope`, `departmentId`, `revokedAt`),
    INDEX `ProcessOwnerAuthority_granter_created_idx`(`grantedById`, `createdAt`),
    UNIQUE INDEX `ProcessOwnerAuthority_user_scopeKey_key`(`penggunaId`, `scopeKey`),
    PRIMARY KEY (`processOwnerAuthorityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessLifecycle` (
    `processId` CHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `archivedAt` DATETIME(3) NULL,
    `archivedReason` VARCHAR(255) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessLifecycle_status_updated_idx`(`status`, `updatedAt`),
    PRIMARY KEY (`processId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

    UNIQUE INDEX `ProcessInvitation_tokenHash_key`(`tokenHash`),
    INDEX `ProcessInvitation_process_status_idx`(`processId`, `status`),
    INDEX `ProcessInvitation_email_status_idx`(`email`, `status`),
    INDEX `ProcessInvitation_inviter_created_idx`(`invitedById`, `createdAt`),
    PRIMARY KEY (`processInvitationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessAudit` (
    `processAuditId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NULL,
    `actorId` CHAR(36) NOT NULL,
    `event` ENUM('OWNER_AUTHORITY_GRANTED', 'OWNER_AUTHORITY_REVOKED', 'PROCESS_CREATED', 'PROCESS_RENAMED', 'PROCESS_ARCHIVED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'INVITATION_CREATED', 'INVITATION_ACCEPTED') NOT NULL,
    `targetUserId` CHAR(36) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProcessAudit_process_created_idx`(`processId`, `createdAt`),
    INDEX `ProcessAudit_actor_created_idx`(`actorId`, `createdAt`),
    INDEX `ProcessAudit_target_created_idx`(`targetUserId`, `createdAt`),
    PRIMARY KEY (`processAuditId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PelaksanaAuditAttribution` (
    `pelaksanaId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NULL,
    `updatedById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PelaksanaAuditAttribution_createdById_idx`(`createdById`),
    INDEX `PelaksanaAuditAttribution_updatedById_idx`(`updatedById`),
    PRIMARY KEY (`pelaksanaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetailSOPPelaksanaSnapshot` (
    `detailSopId` CHAR(36) NOT NULL,
    `pelaksanaId` CHAR(36) NOT NULL,
    `namaSnapshot` VARCHAR(15) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DetailSOPPelaksanaSnapshot_pelaksanaId_idx`(`pelaksanaId`),
    PRIMARY KEY (`detailSopId`, `pelaksanaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Process` ADD CONSTRAINT `Process_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Process` ADD CONSTRAINT `Process_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessMember` ADD CONSTRAINT `ProcessMember_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessMember` ADD CONSTRAINT `ProcessMember_penggunaId_fkey` FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Peraturan` ADD CONSTRAINT `Peraturan_lastEditedById_fkey` FOREIGN KEY (`lastEditedById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SOP` ADD CONSTRAINT `SOP_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailSOP` ADD CONSTRAINT `DetailSOP_revisiDariDetailSopId_fkey` FOREIGN KEY (`revisiDariDetailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailSOP` ADD CONSTRAINT `DetailSOP_dibuatOlehId_fkey` FOREIGN KEY (`dibuatOlehId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailSOP` ADD CONSTRAINT `DetailSOP_sopId_fkey` FOREIGN KEY (`sopId`) REFERENCES `SOP`(`sopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailSOP` ADD CONSTRAINT `DetailSOP_terakhirDieditOlehId_fkey` FOREIGN KEY (`terakhirDieditOlehId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LampiranPeringatan` ADD CONSTRAINT `LampiranPeringatan_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LampiranKualifikasiPelaksanaan` ADD CONSTRAINT `LampiranKualifikasiPelaksanaan_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LampiranPeralatanPerlengkapan` ADD CONSTRAINT `LampiranPeralatanPerlengkapan_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LampiranPencatatanPendataan` ADD CONSTRAINT `LampiranPencatatanPendataan_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DasarHukum` ADD CONSTRAINT `DasarHukum_peraturanId_fkey` FOREIGN KEY (`peraturanId`) REFERENCES `Peraturan`(`peraturanId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DasarHukum` ADD CONSTRAINT `DasarHukum_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SopTerkait` ADD CONSTRAINT `SopTerkait_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SopTerkait` ADD CONSTRAINT `SopTerkait_detailSopTerkaitId_fkey` FOREIGN KEY (`detailSopTerkaitId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LangkahSOP` ADD CONSTRAINT `LangkahSOP_langkahSelanjutnyaTidakId_fkey` FOREIGN KEY (`langkahSelanjutnyaTidakId`) REFERENCES `LangkahSOP`(`langkahSopId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LangkahSOP` ADD CONSTRAINT `LangkahSOP_langkahSelanjutnyaYaId_fkey` FOREIGN KEY (`langkahSelanjutnyaYaId`) REFERENCES `LangkahSOP`(`langkahSopId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LangkahSOP` ADD CONSTRAINT `LangkahSOP_pelaksanaId_fkey` FOREIGN KEY (`pelaksanaId`) REFERENCES `Pelaksana`(`pelaksanaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LangkahSOP` ADD CONSTRAINT `LangkahSOP_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailSOPPelaksana` ADD CONSTRAINT `DetailSOPPelaksana_pelaksanaId_fkey` FOREIGN KEY (`pelaksanaId`) REFERENCES `Pelaksana`(`pelaksanaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailSOPPelaksana` ADD CONSTRAINT `DetailSOPPelaksana_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogEditSOP` ADD CONSTRAINT `LogEditSOP_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogEditSOP` ADD CONSTRAINT `LogEditSOP_penggunaId_fkey` FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogEditSopDomainField` ADD CONSTRAINT `LogEditSopDomainField_detailSopId_penggunaId_logCreatedAt_fkey` FOREIGN KEY (`detailSopId`, `penggunaId`, `logCreatedAt`) REFERENCES `LogEditSOP`(`detailSopId`, `penggunaId`, `createdAt`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DokumenTte` ADD CONSTRAINT `DokumenTte_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiwayatTandaTangan` ADD CONSTRAINT `RiwayatTandaTangan_dokumenTteId_fkey` FOREIGN KEY (`dokumenTteId`) REFERENCES `DokumenTte`(`dokumenTteId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiwayatTandaTangan` ADD CONSTRAINT `RiwayatTandaTangan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KonfigurasiDiagramSOP` ADD CONSTRAINT `KonfigurasiDiagramSOP_detailSopId_fkey` FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OverridePanahDiagramSOP` ADD CONSTRAINT `OverridePanahDiagramSOP_detailSopId_jenis_fkey` FOREIGN KEY (`detailSopId`, `jenis`) REFERENCES `KonfigurasiDiagramSOP`(`detailSopId`, `jenis`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OverridePanahDiagramSOP` ADD CONSTRAINT `OverridePanahDiagramSOP_dariLangkahSopId_fkey` FOREIGN KEY (`dariLangkahSopId`) REFERENCES `LangkahSOP`(`langkahSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OverridePanahDiagramSOP` ADD CONSTRAINT `OverridePanahDiagramSOP_keLangkahSopId_fkey` FOREIGN KEY (`keLangkahSopId`) REFERENCES `LangkahSOP`(`langkahSopId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TitikTekukPanahDiagramSOP` ADD CONSTRAINT `TitikTekukPanahDiagramSOP_detailSopId_jenis_dariLangkahSopI_fkey` FOREIGN KEY (`detailSopId`, `jenis`, `dariLangkahSopId`, `keLangkahSopId`, `cabang`) REFERENCES `OverridePanahDiagramSOP`(`detailSopId`, `jenis`, `dariLangkahSopId`, `keLangkahSopId`, `cabang`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OverrideLabelDiagramSOP` ADD CONSTRAINT `OverrideLabelDiagramSOP_detailSopId_jenis_fkey` FOREIGN KEY (`detailSopId`, `jenis`) REFERENCES `KonfigurasiDiagramSOP`(`detailSopId`, `jenis`) ON DELETE CASCADE ON UPDATE CASCADE;
