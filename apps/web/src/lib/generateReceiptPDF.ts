import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Sale } from '../hooks/useSales'

export function generateReceiptPDF(sale: Sale, tenantName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // Formato de ticket (80mm ancho, largo flexible)
  })

  // Cabecera del ticket
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(tenantName || 'Tienda', 40, 10, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Ticket de Venta', 40, 16, { align: 'center' })

  doc.setFontSize(8)
  const date = new Date(sale.createdAt)
  doc.text(`Fecha: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, 40, 22, { align: 'center' })
  doc.text(`Folio: ${sale.id.slice(-8).toUpperCase()}`, 40, 26, { align: 'center' })

  doc.text('------------------------------------------------', 40, 32, { align: 'center' })

  // Productos
  const tableData = sale.detalles.map((detalle) => [
    detalle.cantidad.toString(),
    detalle.variante.nombreVariante,
    `$${Number(detalle.precioUnitario).toFixed(2)}`,
    `$${(Number(detalle.precioUnitario) * detalle.cantidad).toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: 36,
    head: [['Cant', 'Producto', 'P.U.', 'Importe']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 10 }, // Cantidad
      1: { cellWidth: 30 }, // Producto
      2: { cellWidth: 15, halign: 'right' }, // Precio Unitario
      3: { cellWidth: 15, halign: 'right' }, // Importe
    },
    margin: { left: 5, right: 5 },
  })

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 40

  doc.text('------------------------------------------------', 40, finalY + 4, { align: 'center' })

  // Total
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 10, finalY + 10)
  doc.text(`$${Number(sale.total).toFixed(2)} MXN`, 70, finalY + 10, { align: 'right' })

  // Pie de ticket
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('¡Gracias por su compra!', 40, finalY + 20, { align: 'center' })

  // Guardar PDF
  doc.save(`ticket_${sale.id.slice(-8)}.pdf`)
}
