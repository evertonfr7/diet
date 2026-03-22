-- CreateTable
CREATE TABLE "Food" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "proteina" DOUBLE PRECISION NOT NULL,
    "gorduras" DOUBLE PRECISION NOT NULL,
    "carboidratos" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "proteina" DOUBLE PRECISION NOT NULL,
    "gorduras" DOUBLE PRECISION NOT NULL,
    "carboidratos" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_date_key" ON "DailySummary"("date");
