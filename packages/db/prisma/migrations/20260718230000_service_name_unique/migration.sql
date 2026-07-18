-- AlterTable: add unique constraint on services.name
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");
