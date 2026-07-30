-- CreateTable: proveedores
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "contacto" VARCHAR(100),
    "telefono" VARCHAR(30),
    "email" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: proveedores -> tenants
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: productos -> add proveedor_id
ALTER TABLE "productos" ADD COLUMN "proveedor_id" TEXT;

-- AddForeignKey: productos -> proveedores
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
