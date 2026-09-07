-- Prepare the retired evaluation archive for the immutable FTI contraction.
-- LogNilaiEvaluasi still owns a foreign key to NilaiEvaluasi after both tables
-- were renamed as retired archives. Drop the child first so the contraction can
-- safely drop the parent. The contraction uses DROP TABLE IF EXISTS for both,
-- therefore this changes ordering only and does not change the target schema.
DROP TABLE IF EXISTS `_retired_LogNilaiEvaluasi_20260906`;
