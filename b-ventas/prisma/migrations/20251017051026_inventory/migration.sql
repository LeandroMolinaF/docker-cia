-- AlterTable
ALTER TABLE `order` ADD COLUMN `confirmedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `InventoryAdjustment` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `delta` INTEGER NOT NULL,
    `reason` ENUM('MANUAL_CORRECTION', 'PURCHASE_ORDER', 'SALE', 'RETURN', 'CANCEL_ORDER', 'OTHER') NOT NULL,
    `note` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InventoryAdjustment_idempotencyKey_key`(`idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InventoryAdjustment` ADD CONSTRAINT `InventoryAdjustment_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryAdjustment` ADD CONSTRAINT `InventoryAdjustment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
