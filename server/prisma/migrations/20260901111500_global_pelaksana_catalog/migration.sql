-- Sprint 4: Pelaksana becomes a global reusable actor catalog.
-- `Pelaksana.opdId` remains temporarily as a legacy compatibility shadow only.
-- Exact duplicate actors are consolidated before global uniqueness is enforced.

CREATE TABLE `PelaksanaAuditAttribution` (
  `pelaksanaId` CHAR(36) NOT NULL,
  `createdById` CHAR(36) NULL,
  `updatedById` CHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`pelaksanaId`),
  INDEX `PelaksanaAuditAttribution_createdById_idx` (`createdById`),
  INDEX `PelaksanaAuditAttribution_updatedById_idx` (`updatedById`),
  CONSTRAINT `PelaksanaAuditAttribution_pelaksanaId_fkey`
    FOREIGN KEY (`pelaksanaId`) REFERENCES `Pelaksana` (`pelaksanaId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PelaksanaAuditAttribution_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `Pengguna` (`penggunaId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PelaksanaAuditAttribution_updatedById_fkey`
    FOREIGN KEY (`updatedById`) REFERENCES `Pengguna` (`penggunaId`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DetailSOPPelaksanaSnapshot` (
  `detailSopId` CHAR(36) NOT NULL,
  `pelaksanaId` CHAR(36) NOT NULL,
  `namaSnapshot` VARCHAR(15) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`detailSopId`, `pelaksanaId`),
  INDEX `DetailSOPPelaksanaSnapshot_pelaksanaId_idx` (`pelaksanaId`),
  CONSTRAINT `DetailSOPPelaksanaSnapshot_detailSopId_fkey`
    FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP` (`detailSopId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetailSOPPelaksanaSnapshot_pelaksanaId_fkey`
    FOREIGN KEY (`pelaksanaId`) REFERENCES `Pelaksana` (`pelaksanaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Retire legacy OPD ownership constraints before cross-OPD duplicate rewiring.
-- Migration execution is the controlled cutover boundary; the replacement invariant is installed below.
DROP TRIGGER IF EXISTS `trg_detailsoppelaksana_pelaksana_opd_insert`;
DROP TRIGGER IF EXISTS `trg_detailsoppelaksana_pelaksana_opd_update`;
DROP TRIGGER IF EXISTS `trg_langkahsop_pelaksana_opd_insert`;
DROP TRIGGER IF EXISTS `trg_langkahsop_pelaksana_opd_update`;

-- Normalize names before detecting exact semantic duplicates.
UPDATE `Pelaksana` SET `nama` = TRIM(`nama`);

CREATE TEMPORARY TABLE `_PelaksanaCanonical` AS
SELECT
  p.`pelaksanaId` AS `duplicateId`,
  canonical.`canonicalId`
FROM `Pelaksana` p
JOIN (
  SELECT LOWER(TRIM(`nama`)) AS `normalizedName`, MIN(`pelaksanaId`) AS `canonicalId`
  FROM `Pelaksana`
  GROUP BY LOWER(TRIM(`nama`))
) canonical
  ON LOWER(TRIM(p.`nama`)) = canonical.`normalizedName`
WHERE p.`pelaksanaId` <> canonical.`canonicalId`;

-- Make sure every duplicate swimlane reference has a canonical counterpart before deleting it.
INSERT INTO `DetailSOPPelaksana` (`detailSopId`, `pelaksanaId`, `urutan`, `createdAt`, `updatedAt`)
SELECT d.`detailSopId`, m.`canonicalId`, d.`urutan`, d.`createdAt`, d.`updatedAt`
FROM `DetailSOPPelaksana` d
JOIN `_PelaksanaCanonical` m ON m.`duplicateId` = d.`pelaksanaId`
ON DUPLICATE KEY UPDATE
  `urutan` = LEAST(`DetailSOPPelaksana`.`urutan`, VALUES(`urutan`)),
  `updatedAt` = GREATEST(`DetailSOPPelaksana`.`updatedAt`, VALUES(`updatedAt`));

UPDATE `LangkahSOP` l
JOIN `_PelaksanaCanonical` m ON m.`duplicateId` = l.`pelaksanaId`
SET l.`pelaksanaId` = m.`canonicalId`;

DELETE d
FROM `DetailSOPPelaksana` d
JOIN `_PelaksanaCanonical` m ON m.`duplicateId` = d.`pelaksanaId`;

DELETE p
FROM `Pelaksana` p
JOIN `_PelaksanaCanonical` m ON m.`duplicateId` = p.`pelaksanaId`;

DROP TEMPORARY TABLE `_PelaksanaCanonical`;

-- Catalog identity is global. Existing OPD composite uniqueness can coexist until contract cleanup.
CREATE UNIQUE INDEX `Pelaksana_nama_global_key` ON `Pelaksana` (`nama`);

-- Backfill stable labels for all existing SOP-version swimlanes. Historical creator/editor is unknown,
-- so attribution rows are intentionally not fabricated for existing catalog rows.
INSERT INTO `DetailSOPPelaksanaSnapshot`
  (`detailSopId`, `pelaksanaId`, `namaSnapshot`, `createdAt`, `updatedAt`)
SELECT d.`detailSopId`, d.`pelaksanaId`, p.`nama`, d.`createdAt`, d.`updatedAt`
FROM `DetailSOPPelaksana` d
JOIN `Pelaksana` p ON p.`pelaksanaId` = d.`pelaksanaId`;

-- New invariant: a procedure step may only reference an actor selected into the same DetailSOP swimlane.
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
