-- The immutable contraction has now created
-- RiwayatTandaTangan_dokumenTteId_authority_key, whose leading dokumenTteId
-- column supports the foreign key. Remove the temporary support index so the
-- resulting schema matches the canonical Prisma model without redundant indexes.

DROP INDEX `RiwayatTandaTangan_dokumenTteId_fk_support_idx`
  ON `RiwayatTandaTangan`;
