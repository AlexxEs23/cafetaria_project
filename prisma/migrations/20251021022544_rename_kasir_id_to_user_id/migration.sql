/*
  Warnings:

  - You are about to drop the column `kasirId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_kasirId_fkey`;

-- DropIndex
DROP INDEX `Transaction_kasirId_idx` ON `Transaction`;

-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `kasirId`,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `Transaction_userId_idx` ON `Transaction`(`userId`);

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
