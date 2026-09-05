ALTER TABLE `ProcessFinalApproval`
  ADD COLUMN `processReviewId` CHAR(36) NULL,
  ADD INDEX `ProcessFinalApproval_processReviewId_idx` (`processReviewId`),
  ADD CONSTRAINT `ProcessFinalApproval_processReviewId_fkey`
    FOREIGN KEY (`processReviewId`) REFERENCES `ProcessReview`(`processReviewId`) ON DELETE RESTRICT ON UPDATE CASCADE;
