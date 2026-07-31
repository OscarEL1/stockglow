import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DailyClosingData } from '../hooks/useSales'

export function generateDailyClosingPDF(
  data: DailyClosingData,
  tenantName: string
) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(tenantName || 'Tienda', 14, 14)

  doc.setFontSize(14)
  doc.text('Cierre del Día', 14, 22)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Fecha: ${new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    14,
    30
  )

  if (data.sinVentas) {
    doc.setFontSize(12)
    doc.text('Sin ventas registradas hoy', 14, 42)
    doc.save(`cierre-dia-${data.fecha}.pdf`)
    return
  }

  const rows = data.empleadas.map((e) => [
    e.nombre,
    `$${e.total.toFixed(2)}`,
    e.transacciones.toString(),
  ])

  autoTable(doc, {
    startY: 38,
    head: [['Empleada', 'Total vendido', 'Transacciones']],
    body: rows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [232, 93, 140] },
  })

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Total general: $${data.totalGeneral.toFixed(2)}  |  Transacciones: ${data.totalTransacciones}`,
    14,
    finalY
  )

  doc.save(`cierre-dia-${data.fecha}.pdf`)
}
