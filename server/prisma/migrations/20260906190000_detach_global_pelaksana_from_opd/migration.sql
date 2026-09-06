-- Global Pelaksana is target-domain catalog data. Existing opdId values remain
-- as nullable historical shadows, but new rows no longer require an OPD.
-- The global name invariant already exists from 20260901111500 as
-- `Pelaksana_nama_global_key`; this migration aligns physical index names with
-- the active Prisma contract while removing the obsolete OPD+name access index.

-- Install the replacement FK-supporting index before dropping the legacy
-- composite operational index.
CREATE INDEX `Pelaksana_opdId_idx` ON `Pelaksana`(`opdId`);

ALTER TABLE `Pelaksana`
  DROP INDEX `Pelaksana_opdId_nama_idx`,
  MODIFY `opdId` CHAR(36) NULL;

ALTER TABLE `Pelaksana`
  RENAME INDEX `Pelaksana_nama_global_key` TO `Pelaksana_nama_key`;
