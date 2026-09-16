-- Removing an Anggota Proses Bisnis also clears coordination assignments for
-- that user. SOP content/history is preserved; the Penanggung Jawab can assign
-- another active Penyusun afterwards.

DROP TRIGGER IF EXISTS `trg_process_member_clear_sop_assignment`;
CREATE TRIGGER `trg_process_member_clear_sop_assignment`
BEFORE DELETE ON `ProcessMember`
FOR EACH ROW
BEGIN
  DELETE FROM `SopDrafterAssignment`
  WHERE `processId` = OLD.`processId`
    AND `penyusunId` = OLD.`penggunaId`;
END;
