/*
  Warnings:

  - You are about to drop the column `quantity` on the `TransactionDetail` table. All the data in the column will be lost.
  - Added the required column `hargaSatuan` to the `TransactionDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jumlah` to the `TransactionDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TransactionDetail` DROP COLUMN `quantity`,
    ADD COLUMN `hargaSatuan` DOUBLE NOT NULL,
    ADD COLUMN `jumlah` INTEGER NOT NULL;
