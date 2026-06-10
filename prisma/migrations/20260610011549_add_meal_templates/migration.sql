-- CreateTable
CREATE TABLE "MealTemplate" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealTemplate_pkey" PRIMARY KEY ("id")
);
