ALTER TABLE `DokumenTte`
  ADD COLUMN `processId` CHAR(36) NULL;

UPDATE `DokumenTte` AS d
INNER JOIN `DetailSOP` AS ds ON ds.`detailSopId` = d.`detailSopId`
INNER JOIN `SOP` AS s ON s.`sopId` = ds.`sopId`
SET d.`processId` = s.`processId`
WHERE d.`detailSopId` IS NOT NULL
  AND d.`pengajuanEvaluasiId` IS NULL
  AND s.`processId` IS NOT NULL;

ALTER TABLE `DokumenTte`
  ADD INDEX `DokumenTte_processId_idx` (`processId`),
  ADD CONSTRAINT `DokumenTte_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE;
