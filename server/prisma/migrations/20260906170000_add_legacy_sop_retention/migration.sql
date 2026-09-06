CREATE TABLE `LegacySopRetention` (
  `sopId` CHAR(36) NOT NULL,
  `kind` ENUM('HISTORICAL_OPD', 'HISTORICAL_UNSCOPED') NOT NULL,
  `legacyOpdId` CHAR(36) NULL,
  `legacyOpdNameSnapshot` VARCHAR(100) NULL,
  `sopTitleSnapshot` VARCHAR(120) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `capturedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`sopId`),
  INDEX `LegacySopRetention_kind_idx` (`kind`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `LegacySopRetention` (
  `sopId`,
  `kind`,
  `legacyOpdId`,
  `legacyOpdNameSnapshot`,
  `sopTitleSnapshot`,
  `reason`,
  `capturedAt`
)
SELECT
  s.`sopId`,
  CASE WHEN s.`opdId` IS NULL THEN 'HISTORICAL_UNSCOPED' ELSE 'HISTORICAL_OPD' END,
  s.`opdId`,
  o.`nama`,
  s.`judul`,
  'Captured during Full FTI legacy runtime retirement',
  CURRENT_TIMESTAMP(3)
FROM `SOP` s
LEFT JOIN `OPD` o ON o.`opdId` = s.`opdId`
WHERE s.`processId` IS NULL;
