-- Retire unused legacy evaluation values/history and WhatsApp reminder state.
-- The tables are archived by rename, not dropped, so historical evidence remains
-- recoverable while no active Prisma model/runtime/API depends on them.
RENAME TABLE
  `LogNilaiEvaluasi` TO `_retired_LogNilaiEvaluasi_20260906`,
  `NilaiEvaluasi` TO `_retired_NilaiEvaluasi_20260906`,
  `PengingatWhatsApp` TO `_retired_PengingatWhatsApp_20260906`,
  `NotifikasiInApp` TO `_retired_NotifikasiInApp_20260906`;
