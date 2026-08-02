-- AlterTable: Add missing columns for alerts system
ALTER TABLE "tenants" ADD COLUMN "umbral_dias_caducidad" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "variantes_producto" ADD COLUMN "alerta_leida" BOOLEAN NOT NULL DEFAULT false;
