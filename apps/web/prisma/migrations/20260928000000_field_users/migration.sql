-- Per-person logins for the worker-facing app, limited to specific modules.
CREATE TABLE "FieldUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "modules" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FieldUser_username_key" ON "FieldUser"("username");
