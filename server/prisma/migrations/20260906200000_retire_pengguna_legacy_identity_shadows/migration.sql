-- `Pengguna.peran` and `Pengguna.opdId` are retained only as nullable historical
-- shadows. Native FTI accounts are authorized by PlatformRole, Process
-- relationship, and OrganizationalAuthority and therefore do not receive a
-- fabricated global workflow role or OPD identity.
--
-- `RiwayatTandaTangan.peran` is intentionally unchanged: it remains immutable
-- historical signing evidence.

DROP TRIGGER IF EXISTS `trg_pengguna_singleton_pj_evaluator_insert`;
DROP TRIGGER IF EXISTS `trg_pengguna_singleton_pj_evaluator_update`;

ALTER TABLE `Pengguna`
  MODIFY `peran` ENUM(
    'PJ_EVALUATOR',
    'EVALUATOR',
    'KEPALA_OPD',
    'PJ_PENYUSUN',
    'PENYUSUN'
  ) NULL;
