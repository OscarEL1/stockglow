import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Sale } from '../hooks/useSales'

export function generateSalesReportPDF(
  sales: Sale[],
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Reporte de Ventas', 14, 20)

  doc.setFontSize(11)
  doc.text(`Periodo: ${startDate || 'Inicio'} - ${endDate || 'Hoy'}`, 14, 30)

  let totalGeneral = 0

  const rows = sales.map((sale) => {
    const productos = sale.detalles
      .map((d) => `${d.variante.nombreVariante} (${d.cantidad})`)
      .join('\n')

    totalGeneral += Number(sale.total)

    return [
      new Date(sale.createdAt).toLocaleDateString(),
      productos,
      `$${Number(sale.total).toFixed(2)}`,
    ]
  })

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Productos', 'Total']],
    body: rows,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [232, 93, 140],
    },
  })

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15

  doc.setFontSize(13)
  doc.text(`Total general del periodo: $${totalGeneral.toFixed(2)}`, 14, finalY)

  doc.save('reporte-ventas.pdf')
}
