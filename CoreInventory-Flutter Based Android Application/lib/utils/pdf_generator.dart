import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/movement.dart';

class PdfGenerator {
  static const _primary = PdfColor.fromInt(0xFF0F172A);
  static const _accent = PdfColor.fromInt(0xFF22C55E);
  static const _grey = PdfColor.fromInt(0xFF64748B);
  static const _lightGrey = PdfColor.fromInt(0xFFF1F5F9);
  static const _border = PdfColor.fromInt(0xFFE2E8F0);

  /// Generates and shares a PDF receipt for the given movement document.
  /// [serverResponse] is the response body returned by the API after creation.
  static Future<void> shareReceipt({
    required BuildContext context,
    required MovementDocument doc,
    required Map<String, dynamic> serverResponse,
  }) async {
    final pdf = pw.Document();
    final ref = serverResponse['ref']?.toString() ??
        serverResponse['id']?.toString() ??
        '—';
    final now = DateTime.now();
    final dateStr =
        '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('CoreInventory',
                        style: pw.TextStyle(
                            fontSize: 22,
                            fontWeight: pw.FontWeight.bold,
                            color: _primary)),
                    pw.Text('Warehouse Management System',
                        style: pw.TextStyle(fontSize: 9, color: _grey)),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(
                      horizontal: 14, vertical: 6),
                  decoration: pw.BoxDecoration(
                    color: _accent,
                    borderRadius: pw.BorderRadius.circular(6),
                  ),
                  child: pw.Text(doc.type.label.toUpperCase(),
                      style: pw.TextStyle(
                          color: PdfColors.white,
                          fontSize: 12,
                          fontWeight: pw.FontWeight.bold)),
                ),
              ],
            ),
            pw.SizedBox(height: 4),
            pw.Divider(color: _border, thickness: 1),
            pw.SizedBox(height: 12),

            // ── Document info ────────────────────────────────────────
            pw.Container(
              padding: const pw.EdgeInsets.all(14),
              decoration: pw.BoxDecoration(
                color: _lightGrey,
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Row(
                children: [
                  _infoBlock('Reference', ref),
                  pw.SizedBox(width: 24),
                  _infoBlock('Date', dateStr),
                  pw.SizedBox(width: 24),
                  _infoBlock('Time', timeStr),
                  if (doc.supplierOrDest != null) ...[
                    pw.SizedBox(width: 24),
                    _infoBlock(
                      doc.type == MovementType.receipt
                          ? 'Supplier'
                          : 'Destination',
                      doc.supplierOrDest!,
                    ),
                  ],
                ],
              ),
            ),
            pw.SizedBox(height: 12),

            // ── Location ─────────────────────────────────────────────
            if (doc.type == MovementType.transfer) ...[
              _labelRow('From Location',
                  serverResponse['from_location_name']?.toString() ?? '—'),
              pw.SizedBox(height: 4),
              _labelRow('To Location',
                  serverResponse['to_location_name']?.toString() ?? '—'),
            ] else ...[
              _labelRow('Location',
                  serverResponse['location_name']?.toString() ?? '—'),
            ],
            pw.SizedBox(height: 16),

            // ── Products table ───────────────────────────────────────
            pw.Text('Product Lines',
                style: pw.TextStyle(
                    fontSize: 13,
                    fontWeight: pw.FontWeight.bold,
                    color: _primary)),
            pw.SizedBox(height: 6),
            pw.Table(
              border: pw.TableBorder.all(color: _border, width: 0.5),
              columnWidths: {
                0: const pw.FlexColumnWidth(0.4),
                1: const pw.FlexColumnWidth(3),
                2: const pw.FlexColumnWidth(1.5),
                3: const pw.FlexColumnWidth(1),
              },
              children: [
                // Header row
                pw.TableRow(
                  decoration: pw.BoxDecoration(color: _primary),
                  children: [
                    _tableHeader('#'),
                    _tableHeader('Product'),
                    _tableHeader('SKU'),
                    _tableHeader('Qty'),
                  ],
                ),
                // Data rows
                ...doc.lines.asMap().entries.map((e) {
                  final i = e.key;
                  final line = e.value;
                  final isEven = i % 2 == 0;
                  return pw.TableRow(
                    decoration: isEven
                        ? null
                        : const pw.BoxDecoration(color: _lightGrey),
                    children: [
                      _tableCell('${i + 1}'),
                      _tableCell(line.productName ?? '—'),
                      _tableCell(line.productSku ?? '—'),
                      _tableCell(line.qty.toStringAsFixed(
                          line.qty == line.qty.roundToDouble() ? 0 : 2)),
                    ],
                  );
                }),
              ],
            ),
            pw.SizedBox(height: 8),

            // ── Total ─────────────────────────────────────────────────
            pw.Align(
              alignment: pw.Alignment.centerRight,
              child: pw.Container(
                padding: const pw.EdgeInsets.symmetric(
                    horizontal: 16, vertical: 8),
                decoration: pw.BoxDecoration(
                  color: _primary,
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Text(
                  'Total Lines: ${doc.lines.length}  •  Total Qty: ${doc.lines.fold<double>(0, (s, l) => s + l.qty).toStringAsFixed(0)}',
                  style: pw.TextStyle(
                      color: PdfColors.white,
                      fontSize: 11,
                      fontWeight: pw.FontWeight.bold),
                ),
              ),
            ),

            // ── Notes ─────────────────────────────────────────────────
            if (doc.notes != null && doc.notes!.isNotEmpty) ...[
              pw.SizedBox(height: 12),
              pw.Text('Notes:',
                  style: pw.TextStyle(
                      fontSize: 11, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 4),
              pw.Text(doc.notes!,
                  style:
                      pw.TextStyle(fontSize: 11, color: _grey)),
            ],

            pw.Spacer(),

            // ── Footer ────────────────────────────────────────────────
            pw.Divider(color: _border),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('Generated by CoreInventory',
                    style: pw.TextStyle(fontSize: 8, color: _grey)),
                pw.Text('$dateStr $timeStr',
                    style: pw.TextStyle(fontSize: 8, color: _grey)),
              ],
            ),
          ],
        ),
      ),
    );

    final bytes = await pdf.save();
    final filename =
        '${doc.type.label.toLowerCase()}_${ref.replaceAll('/', '-')}_$dateStr.pdf'
            .replaceAll('/', '-');
    await Printing.sharePdf(bytes: bytes, filename: filename);
  }

  static pw.Widget _infoBlock(String label, String value) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label,
            style: pw.TextStyle(fontSize: 8, color: _grey)),
        pw.SizedBox(height: 2),
        pw.Text(value,
            style: pw.TextStyle(
                fontSize: 11,
                fontWeight: pw.FontWeight.bold,
                color: _primary)),
      ],
    );
  }

  static pw.Widget _labelRow(String label, String value) {
    return pw.Row(children: [
      pw.Text('$label: ',
          style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: _primary)),
      pw.Text(value,
          style: pw.TextStyle(fontSize: 10, color: _grey)),
    ]);
  }

  static pw.Widget _tableHeader(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: pw.Text(text,
          style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white)),
    );
  }

  static pw.Widget _tableCell(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      child: pw.Text(text,
          style: pw.TextStyle(fontSize: 10, color: _primary)),
    );
  }
}
