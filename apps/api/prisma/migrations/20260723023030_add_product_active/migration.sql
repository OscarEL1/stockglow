ALTER TABLE "productos"
ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "productos_tenant_id_activo_idx"
ON "productos"("tenant_id", "activo");
