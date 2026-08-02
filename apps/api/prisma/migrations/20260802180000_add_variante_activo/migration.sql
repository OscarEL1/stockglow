-- AlterTable: Add missing activo column for soft-delete of variants
ALTER TABLE "variantes_producto" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;
