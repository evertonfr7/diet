/*
  Warnings:

  - You are about to drop the column `carboidratos` on the `DailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `gorduras` on the `DailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `proteina` on the `DailySummary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailySummary" DROP COLUMN "carboidratos",
DROP COLUMN "gorduras",
DROP COLUMN "proteina";

-- CreateTable
CREATE TABLE "SyncRecord" (
    "id" SERIAL NOT NULL,
    "dailySummaryId" INTEGER NOT NULL,
    "proteina" DOUBLE PRECISION NOT NULL,
    "gorduras" DOUBLE PRECISION NOT NULL,
    "carboidratos" DOUBLE PRECISION NOT NULL,
    "agua" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "waterGoal" INTEGER NOT NULL DEFAULT 2000,
    "waterNotifEnabled" BOOLEAN NOT NULL DEFAULT false,
    "waterNotifInterval" INTEGER NOT NULL DEFAULT 30,
    "calorieTarget" INTEGER NOT NULL DEFAULT 2000,
    "proteinTarget" INTEGER NOT NULL DEFAULT 150,
    "carbTarget" INTEGER NOT NULL DEFAULT 250,
    "fatTarget" INTEGER NOT NULL DEFAULT 70,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SyncRecord" ADD CONSTRAINT "SyncRecord_dailySummaryId_fkey" FOREIGN KEY ("dailySummaryId") REFERENCES "DailySummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
