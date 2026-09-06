-- Global Pelaksana is target-domain catalog data. Existing opdId values remain
-- as nullable historical shadows, but new rows no longer require an OPD.
-- Creating the global unique index fails safely if production data contains
-- duplicate names that must be resolved before cutover.
ALTER TABLE `Pelaksana`
  DROP INDEX `Pelaksana_opdId_nama_key`,
  MODIFY `opdId` CHAR(36) NULL;

CREATE UNIQUE INDEX `Pelaksana_nama_key` ON `Pelaksana`(`nama`);
