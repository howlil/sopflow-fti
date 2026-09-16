-- Bulk submission package for Process Review. Lifecycle truth remains on DetailSOP.
CREATE TABLE `ProcessReviewBatch` (
    `processReviewBatchId` CHAR(36) NOT NULL,
    `processId` CHAR(36) NOT NULL,
    `diajukanOlehId` CHAR(36) NOT NULL,
    `reviewerId` CHAR(36) NOT NULL,
    `status` ENUM('IN_REVIEW', 'PARTIALLY_COMPLETED', 'COMPLETED') NOT NULL DEFAULT 'IN_REVIEW',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessReviewBatch_process_status_submittedAt_idx`(`processId`, `status`, `submittedAt`),
    INDEX `ProcessReviewBatch_submittedBy_submittedAt_idx`(`diajukanOlehId`, `submittedAt`),
    INDEX `ProcessReviewBatch_reviewer_status_idx`(`reviewerId`, `status`),
    PRIMARY KEY (`processReviewBatchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProcessReviewBatchItem` (
    `processReviewBatchItemId` CHAR(36) NOT NULL,
    `processReviewBatchId` CHAR(36) NOT NULL,
    `detailSopId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProcessReviewBatchItem_detailSopId_key`(`detailSopId`),
    INDEX `ProcessReviewBatchItem_batch_createdAt_idx`(`processReviewBatchId`, `createdAt`),
    PRIMARY KEY (`processReviewBatchItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProcessReviewBatch`
    ADD CONSTRAINT `ProcessReviewBatch_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProcessReviewBatch`
    ADD CONSTRAINT `ProcessReviewBatch_diajukanOlehId_fkey`
    FOREIGN KEY (`diajukanOlehId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProcessReviewBatch`
    ADD CONSTRAINT `ProcessReviewBatch_reviewerId_fkey`
    FOREIGN KEY (`reviewerId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProcessReviewBatchItem`
    ADD CONSTRAINT `ProcessReviewBatchItem_processReviewBatchId_fkey`
    FOREIGN KEY (`processReviewBatchId`) REFERENCES `ProcessReviewBatch`(`processReviewBatchId`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ProcessReviewBatchItem`
    ADD CONSTRAINT `ProcessReviewBatchItem_detailSopId_fkey`
    FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE RESTRICT ON UPDATE CASCADE;
