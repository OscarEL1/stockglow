-- AlterTable: tenants -> add descuento_porcentaje_frecuente
ALTER TABLE "tenants" ADD COLUMN "descuento_porcentaje_frecuente" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: ventas -> add cliente_frecuente
ALTER TABLE "ventas" ADD COLUMN "cliente_frecuente" BOOLEAN NOT NULL DEFAULT false;
