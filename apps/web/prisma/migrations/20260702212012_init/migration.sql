-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "worker" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "leaveType" TEXT,
    "morningIn" TEXT,
    "morningOut" TEXT,
    "morningType" TEXT,
    "morningDesc" TEXT,
    "morningOk" BOOLEAN,
    "morningBonus" INTEGER,
    "eveningIn" TEXT,
    "eveningOut" TEXT,
    "eveningType" TEXT,
    "eveningDesc" TEXT,
    "eveningOk" BOOLEAN,
    "eveningBonus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machinery" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "driver" TEXT,
    "start" DOUBLE PRECISION,
    "end" DOUBLE PRECISION,
    "usefulHours" DOUBLE PRECISION,
    "category" TEXT NOT NULL,
    "details" TEXT,
    "cost" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machinery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Irrigation" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "worker" TEXT,
    "state" INTEGER[],
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Irrigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PestFertilizer" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "garden" TEXT NOT NULL,
    "op" TEXT NOT NULL,
    "material" TEXT,
    "dose" TEXT,
    "target" TEXT,
    "operator" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PestFertilizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orchard" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "garden" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "worker" TEXT,
    "count" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orchard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "party" TEXT,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accounting" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "party" TEXT,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accounting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Harvest" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "harvested" DOUBLE PRECISION,
    "sold" DOUBLE PRECISION,
    "price" INTEGER,
    "buyer" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Harvest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sheep" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "amount" INTEGER,
    "person" TEXT,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sheep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Security" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT,
    "identified" TEXT,
    "action" TEXT,
    "reporter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_uid_key" ON "Attendance"("uid");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_worker_idx" ON "Attendance"("worker");

-- CreateIndex
CREATE UNIQUE INDEX "Machinery_uid_key" ON "Machinery"("uid");

-- CreateIndex
CREATE INDEX "Machinery_date_idx" ON "Machinery"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Irrigation_uid_key" ON "Irrigation"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Irrigation_date_key" ON "Irrigation"("date");

-- CreateIndex
CREATE INDEX "Irrigation_date_idx" ON "Irrigation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PestFertilizer_uid_key" ON "PestFertilizer"("uid");

-- CreateIndex
CREATE INDEX "PestFertilizer_date_idx" ON "PestFertilizer"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Orchard_uid_key" ON "Orchard"("uid");

-- CreateIndex
CREATE INDEX "Orchard_date_idx" ON "Orchard"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_uid_key" ON "Inventory"("uid");

-- CreateIndex
CREATE INDEX "Inventory_date_idx" ON "Inventory"("date");

-- CreateIndex
CREATE INDEX "Inventory_item_idx" ON "Inventory"("item");

-- CreateIndex
CREATE UNIQUE INDEX "Accounting_uid_key" ON "Accounting"("uid");

-- CreateIndex
CREATE INDEX "Accounting_date_idx" ON "Accounting"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Harvest_uid_key" ON "Harvest"("uid");

-- CreateIndex
CREATE INDEX "Harvest_date_idx" ON "Harvest"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Sheep_uid_key" ON "Sheep"("uid");

-- CreateIndex
CREATE INDEX "Sheep_date_idx" ON "Sheep"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Security_uid_key" ON "Security"("uid");

-- CreateIndex
CREATE INDEX "Security_date_idx" ON "Security"("date");

