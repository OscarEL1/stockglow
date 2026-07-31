import * as XLSX from 'xlsx'
import type { DeadStockItem } from '../hooks/useReports'

export function exportDeadStockExcel(items: DeadStockItem[]) {
  const data = items.map((v) => ({
    Producto: v.producto,
    Variante: v.variante,
    SKU: v.sku,
    'Stock actual': v.stockActual,
    'Último movimiento': v.ultimoMovimiento
      ? new Date(v.ultimoMovimiento).toLocaleDateString('es-MX')
      : 'Sin movimiento',
  }))

  const ws = XLSX.utils.json_to_sheet(data)

  // Anchos de columna
  ws['!cols'] = [
    { wch: 30 },
    { wch: 25 },
    { wch: 15 },
    { wch: 14 },
    { wch: 20 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sin movimiento')
  XLSX.writeFile(wb, 'productos-sin-movimiento.xlsx')
}
