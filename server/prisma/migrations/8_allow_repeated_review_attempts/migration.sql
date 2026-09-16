-- A DetailSOP may be submitted again after a revision request. Keep package
-- membership unique within one package while retaining prior package evidence.
ALTER TABLE `ProcessReviewBatchItem`
    ADD INDEX `ProcessReviewBatchItem_detail_idx`(`detailSopId`),
    DROP INDEX `ProcessReviewBatchItem_detailSopId_key`;

CREATE UNIQUE INDEX `ProcessReviewBatchItem_batch_detail_key`
    ON `ProcessReviewBatchItem`(`processReviewBatchId`, `detailSopId`);
