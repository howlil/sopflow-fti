-- M14 S2: complete the native Process ownership contract.
-- Existing legacy SOP rows retain their OPD value; native SOP rows may leave
-- the compatibility shadow empty and use SOP.processId as their owner.

ALTER TABLE `SOP`
  MODIFY COLUMN `opdId` CHAR(36) NULL;
