import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function generateReceiptPDF(receipt) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const generatedAt = new Date().toLocaleString()

  // ── Colour palette ──────────────────────────────────────────────
  const indigo  = [79, 70, 229]
  const dark    = [17, 24, 39]
  const muted   = [107, 114, 128]
  const light   = [249, 250, 251]
  const border  = [229, 231, 235]

  // ── HEADER BAND ─────────────────────────────────────────────────
  doc.setFillColor(...indigo)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CoreInventory Management System', 14, 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Real-time inventory control for modern businesses', 14, 18)

  // GOODS RECEIPT label (right-aligned)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('GOODS RECEIPT', pageW - 14, 16, { align: 'right' })

  // ── REF + GENERATED DATE ROW ────────────────────────────────────
  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Reference: ${receipt.ref}`, 14, 38)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...muted)
  doc.text(`Generated: ${generatedAt}`, pageW - 14, 38, { align: 'right' })

  // Divider
  doc.setDrawColor(...border)
  doc.setLineWidth(0.3)
  doc.line(14, 42, pageW - 14, 42)

  // ── TWO-COLUMN INFO BOXES ────────────────────────────────────────
  const boxTop = 46
  const boxH   = 40
  const colW   = (pageW - 28 - 6) / 2

  // Left box — Supplier Info
  doc.setFillColor(...light)
  doc.setDrawColor(...border)
  doc.roundedRect(14, boxTop, colW, boxH, 2, 2, 'FD')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...indigo)
  doc.text('SUPPLIER INFORMATION', 18, boxTop + 7)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...dark)
  const supplierRows = [
    ['Supplier',   receipt.supplier || '—'],
    ['Warehouse',  receipt.warehouse_name || '—'],
    ['Location',   receipt.location_name || '—'],
  ]
  let sy = boxTop + 13
  supplierRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...muted)
    doc.setFontSize(7)
    doc.text(label + ':', 18, sy)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...dark)
    doc.text(val, 46, sy)
    sy += 7
  })

  // Right box — Receipt Details
  const rx = 14 + colW + 6
  doc.setFillColor(...light)
  doc.setDrawColor(...border)
  doc.roundedRect(rx, boxTop, colW, boxH, 2, 2, 'FD')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...indigo)
  doc.text('RECEIPT DETAILS', rx + 4, boxTop + 7)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...dark)
  const detailRows = [
    ['Status',        (receipt.status || '—').toUpperCase()],
    ['Schedule Date', receipt.schedule_date ? new Date(receipt.schedule_date).toLocaleDateString() : '—'],
    ['Responsible',   receipt.responsible || '—'],
    ['Dest. Type',    receipt.destination_type || '—'],
  ]
  let dy = boxTop + 13
  detailRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...muted)
    doc.setFontSize(7)
    doc.text(label + ':', rx + 4, dy)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...dark)
    doc.text(val, rx + 34, dy)
    dy += 7
  })

  // ── PRODUCTS TABLE ───────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text('Products', 14, boxTop + boxH + 12)

  const tableRows = (receipt.lines || []).map((line, i) => [
    i + 1,
    line.sku || '—',
    line.product_name || '—',
    line.uom || '—',
    line.expected_qty ?? '—',
    line.received_qty ?? '—',
  ])

  autoTable(doc, {
    startY: boxTop + boxH + 16,
    head: [['#', 'SKU', 'Product Name', 'UOM', 'Expected Qty', 'Received Qty']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: indigo,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: dark },
    alternateRowStyles: { fillColor: light },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 28, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  })

  // ── NOTES ────────────────────────────────────────────────────────
  if (receipt.notes) {
    const afterTable = doc.lastAutoTable.finalY + 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...dark)
    doc.text('Notes', 14, afterTable)

    doc.setFillColor(...light)
    doc.setDrawColor(...border)
    doc.roundedRect(14, afterTable + 3, pageW - 28, 14, 2, 2, 'FD')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    const noteLines = doc.splitTextToSize(receipt.notes, pageW - 36)
    doc.text(noteLines, 18, afterTable + 10)
  }

  // ── FOOTER ───────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(...border)
    doc.setLineWidth(0.3)
    doc.line(14, pageH - 14, pageW - 14, pageH - 14)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...muted)
    doc.text('Generated by CoreInventory Management System', 14, pageH - 8)
    doc.text(`${generatedAt}  ·  Page ${p} of ${totalPages}`, pageW - 14, pageH - 8, { align: 'right' })
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────
  const filename = `receipt_${receipt.ref.replace(/\//g, '-')}.pdf`
  doc.save(filename)
}
