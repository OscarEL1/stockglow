import * as XLSX from 'xlsx'
import type { Product } from '../hooks/useProducts'

export function exportInventoryExcel(products: Product[]) {
  const data = products.flatMap((p) =>
    p.variantes.map((v) => ({
      Producto: p.nombre,
      Variante: v.nombreVariante,
      SKU: v.sku,
      Precio: Number(v.precioVenta),
      'Stock actual': v.stockActual,
      'Stock mínimo': v.stockMinimo,
      'Fecha de caducidad': v.fechaCaducidad
        ? new Date(v.fechaCaducidad).toLocaleDateString('es-MX')
        : '',
    }))
  )
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, 'inventario-stockglow.xlsx')
}
