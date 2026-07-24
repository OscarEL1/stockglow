import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PaymentMethod, Sale } from '../hooks/useSales'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
}

export function generateReceiptPDF(sale: Sale, tenantName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200],
  })

  // Cabecera
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(tenantName || 'Tienda', 40, 10, {
    align: 'center',
  })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Ticket de Venta', 40, 16, {
    align: 'center',
  })

  doc.setFontSize(8)

  const date = new Date(sale.createdAt)

  doc.text(
    `Fecha: ${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString(
      'es-MX'
    )}`,
    40,
    22,
    {
      align: 'center',
    }
  )

  doc.text(`Folio: ${sale.id.slice(-8).toUpperCase()}`, 40, 26, {
    align: 'center',
  })

  doc.text('------------------------------------------------', 40, 32, {
    align: 'center',
  })

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
    styles: {
      fontSize: 8,
      cellPadding: 1,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 15, halign: 'right' },
    },
    margin: {
      left: 5,
      right: 5,
    },
  })

  // @ts-expect-error jspdf-autotable no expone lastAutoTable
  const finalY = doc.lastAutoTable.finalY || 40

  doc.text('------------------------------------------------', 40, finalY + 4, {
    align: 'center',
  })

  // Método de pago
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Método de pago: ${PAYMENT_METHOD_LABELS[sale.metodoPago]}`,
    10,
    finalY + 10
  )

  // Descuento
  if (Number(sale.descuento ?? 0) > 0) {
    doc.text(
      `Descuento: -$${Number(sale.descuento).toFixed(2)}`,
      70,
      finalY + 15,
      {
        align: 'right',
      }
    )
  }

  // Total
  const totalY = Number(sale.descuento ?? 0) > 0 ? finalY + 21 : finalY + 16

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 10, totalY)
  doc.text(`$${Number(sale.total).toFixed(2)} MXN`, 70, totalY, {
    align: 'right',
  })

  // Pie
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('¡Gracias por su compra!', 40, totalY + 10, {
    align: 'center',
  })

  doc.save(`ticket_${sale.id.slice(-8)}.pdf`)
}
