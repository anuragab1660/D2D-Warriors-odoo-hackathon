import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../models/movement.dart';
import '../models/location.dart';
import '../models/product.dart';
import '../providers/movement_provider.dart';
import '../providers/warehouse_provider.dart';
import '../services/product_service.dart';
import '../utils/app_theme.dart';
import '../utils/pdf_generator.dart';

class BarcodeScannerScreen extends StatefulWidget {
  /// When true, after scanning the app looks up the product and lets the user
  /// create a quick inventory movement (adjust/receive) right from this screen.
  final bool quickUpdate;

  const BarcodeScannerScreen({super.key, this.quickUpdate = false});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen>
    with WidgetsBindingObserver {
  late MobileScannerController _controller;
  bool _hasScanned = false;
  bool _torchEnabled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    if (widget.quickUpdate) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<WarehouseProvider>().fetchLocations();
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _controller.start();
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  void _onBarcodeDetected(BarcodeCapture capture) {
    if (_hasScanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;
    _hasScanned = true;
    _controller.stop();

    if (widget.quickUpdate) {
      _handleQuickUpdate(barcode!.rawValue!);
    } else {
      Navigator.of(context).pop(barcode!.rawValue);
    }
  }

  Future<void> _handleQuickUpdate(String scannedValue) async {
    // Show loading overlay
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 12),
                Text('Looking up product...'),
              ],
            ),
          ),
        ),
      ),
    );

    final product =
        await ProductService().getProductBySku(scannedValue);

    if (!mounted) return;
    Navigator.of(context).pop(); // close loading

    if (product == null) {
      // Not found — offer manual entry or go back
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Product Not Found'),
          content: Text(
              'No product matched "$scannedValue".\nTry scanning again or enter SKU manually.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() => _hasScanned = false);
                _controller.start();
              },
              child: const Text('Scan Again'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _showManualEntry(context, quickUpdate: true);
              },
              child: const Text('Enter SKU'),
            ),
          ],
        ),
      );
      return;
    }

    _showQuickUpdateSheet(product);
  }

  void _showQuickUpdateSheet(Product product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _QuickUpdateSheet(product: product),
    ).then((_) {
      // Allow re-scanning after sheet is dismissed
      if (mounted) {
        setState(() => _hasScanned = false);
        _controller.start();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(widget.quickUpdate ? 'Scan to Update Stock' : 'Scan Barcode'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(
              _torchEnabled ? Icons.flash_on : Icons.flash_off,
              color: _torchEnabled ? AppTheme.warning : Colors.white,
            ),
            onPressed: () {
              _controller.toggleTorch();
              setState(() => _torchEnabled = !_torchEnabled);
            },
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios_outlined),
            onPressed: _controller.switchCamera,
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onBarcodeDetected,
          ),
          CustomPaint(
            painter: _ScannerOverlayPainter(),
            child: const SizedBox.expand(),
          ),
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Text(
                    widget.quickUpdate
                        ? 'Scan product barcode to update inventory'
                        : 'Point camera at product barcode or QR code',
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => _showManualEntry(context,
                      quickUpdate: widget.quickUpdate),
                  child: const Text(
                    'Enter SKU manually',
                    style: TextStyle(
                        color: AppTheme.accent, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showManualEntry(BuildContext context, {bool quickUpdate = false}) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Enter SKU'),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            hintText: 'e.g. SKU-001',
            labelText: 'Product SKU',
          ),
          onSubmitted: (v) {
            if (v.isNotEmpty) {
              Navigator.of(context).pop();
              if (quickUpdate) {
                _hasScanned = true;
                _controller.stop();
                _handleQuickUpdate(v.trim());
              } else {
                Navigator.of(context).pop(v.trim());
              }
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final sku = controller.text.trim();
              if (sku.isNotEmpty) {
                Navigator.of(context).pop();
                if (quickUpdate) {
                  _hasScanned = true;
                  _controller.stop();
                  _handleQuickUpdate(sku);
                } else {
                  Navigator.of(context).pop(sku);
                }
              }
            },
            child: const Text('Search'),
          ),
        ],
      ),
    );
  }
}

// ── Quick update bottom sheet ─────────────────────────────────────────────────

class _QuickUpdateSheet extends StatefulWidget {
  final Product product;
  const _QuickUpdateSheet({required this.product});

  @override
  State<_QuickUpdateSheet> createState() => _QuickUpdateSheetState();
}

class _QuickUpdateSheetState extends State<_QuickUpdateSheet> {
  MovementType _type = MovementType.adjustment;
  Location? _location;
  Location? _fromLocation;
  Location? _toLocation;
  final _qtyController = TextEditingController();
  final _partyController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _qtyController.dispose();
    _partyController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final qty = double.tryParse(_qtyController.text.trim()) ?? 0;
    if (qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Enter a valid quantity.'),
          backgroundColor: AppTheme.error));
      return;
    }
    if (_type == MovementType.transfer &&
        (_fromLocation == null || _toLocation == null)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Select both source and destination locations.'),
          backgroundColor: AppTheme.error));
      return;
    }
    if (_type != MovementType.transfer && _location == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Select a location.'),
          backgroundColor: AppTheme.error));
      return;
    }

    setState(() => _submitting = true);

    final doc = MovementDocument(
      type: _type,
      locationId: _location?.id,
      fromLocationId: _fromLocation?.id,
      toLocationId: _toLocation?.id,
      supplierOrDest: _partyController.text.trim().isNotEmpty
          ? _partyController.text.trim()
          : null,
      lines: [
        MovementLine(
          productId: widget.product.id,
          productName: widget.product.name,
          productSku: widget.product.sku,
          qty: qty,
        ),
      ],
    );

    final movProv = context.read<MovementProvider>();
    final success = await movProv.createDocument(doc);

    if (!mounted) return;
    setState(() => _submitting = false);

    if (success) {
      final serverResponse = movProv.lastCreatedResponse ?? {};
      movProv.clearMessages();
      Navigator.of(context).pop(); // close sheet
      _showSuccessDialog(doc, serverResponse);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(movProv.errorMessage ?? 'Failed to create.'),
          backgroundColor: AppTheme.error));
      movProv.clearMessages();
    }
  }

  void _showSuccessDialog(
      MovementDocument doc, Map<String, dynamic> serverResponse) {
    final ref = serverResponse['ref']?.toString() ??
        serverResponse['id']?.toString();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(
              radius: 28,
              backgroundColor: AppTheme.accent,
              child: Icon(Icons.check, color: Colors.white, size: 32),
            ),
            const SizedBox(height: 16),
            Text('${doc.type.label} Created!',
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary)),
            if (ref != null) ...[
              const SizedBox(height: 4),
              Text('Ref: $ref',
                  style: const TextStyle(
                      fontSize: 12, color: AppTheme.textSecondary)),
            ],
            const SizedBox(height: 4),
            Text(
                '${widget.product.name} — Qty: ${doc.lines.first.qty.toStringAsFixed(0)}',
                style: const TextStyle(
                    fontSize: 12, color: AppTheme.textSecondary),
                textAlign: TextAlign.center),
          ],
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          OutlinedButton.icon(
            onPressed: () async {
              Navigator.of(context).pop();
              try {
                await PdfGenerator.shareReceipt(
                  context: context,
                  doc: doc,
                  serverResponse: serverResponse,
                );
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text('PDF error: $e'),
                      backgroundColor: AppTheme.error));
                }
              }
            },
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('Download PDF'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locations = context.watch<WarehouseProvider>().locations;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: AppTheme.border,
                      borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),

            // Product info card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.qr_code_scanner,
                      color: AppTheme.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.product.name,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary)),
                      Text(
                          '${widget.product.sku} • Stock: ${widget.product.onHand.toStringAsFixed(0)} ${widget.product.uom ?? ''}',
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
                if (widget.product.isLowStock)
                  const Icon(Icons.warning_amber,
                      color: AppTheme.warning, size: 18),
              ]),
            ),
            const SizedBox(height: 16),

            // Movement type
            const Text('Movement Type',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: MovementType.values.map((t) {
                final sel = _type == t;
                return ChoiceChip(
                  label: Text(t.label),
                  selected: sel,
                  onSelected: (_) => setState(() {
                    _type = t;
                    _location = null;
                    _fromLocation = null;
                    _toLocation = null;
                  }),
                  selectedColor: AppTheme.primary,
                  labelStyle: TextStyle(
                      color: sel ? Colors.white : AppTheme.textPrimary,
                      fontSize: 12),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),

            // Supplier / destination
            if (_type == MovementType.receipt ||
                _type == MovementType.delivery) ...[
              TextField(
                controller: _partyController,
                decoration: InputDecoration(
                  labelText: _type == MovementType.receipt
                      ? 'Supplier (optional)'
                      : 'Destination (optional)',
                  prefixIcon: const Icon(Icons.business_outlined),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Location picker(s)
            if (_type == MovementType.transfer) ...[
              _locationDropdown(
                  'From Location *', _fromLocation, locations,
                  (v) => setState(() => _fromLocation = v)),
              const SizedBox(height: 10),
              _locationDropdown(
                  'To Location *',
                  _toLocation,
                  locations.where((l) => l.id != _fromLocation?.id).toList(),
                  (v) => setState(() => _toLocation = v)),
            ] else ...[
              _locationDropdown('Location *', _location, locations,
                  (v) => setState(() => _location = v)),
            ],
            const SizedBox(height: 12),

            // Quantity
            TextField(
              controller: _qtyController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Quantity *',
                prefixIcon: Icon(Icons.numbers),
              ),
            ),
            const SizedBox(height: 20),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline),
                label:
                    Text(_submitting ? 'Saving...' : 'Create ${_type.label}'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _locationDropdown(String label, Location? value,
      List<Location> locations, ValueChanged<Location?> onChanged) {
    return DropdownButtonFormField<Location>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.location_on_outlined),
      ),
      hint: const Text('Select location'),
      isExpanded: true,
      items: locations
          .map((l) => DropdownMenuItem(
                value: l,
                child: Text(l.displayName, overflow: TextOverflow.ellipsis),
              ))
          .toList(),
      onChanged: onChanged,
    );
  }
}

// ── Scanner overlay painter ───────────────────────────────────────────────────

class _ScannerOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const scanSize = 250.0;
    final centerX = size.width / 2;
    final centerY = size.height / 2 - 40;
    final scanRect = Rect.fromCenter(
      center: Offset(centerX, centerY),
      width: scanSize,
      height: scanSize,
    );

    final paint = Paint()..color = Colors.black.withOpacity(0.55);
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, scanRect.top), paint);
    canvas.drawRect(
        Rect.fromLTWH(0, scanRect.top, scanRect.left, scanRect.height),
        paint);
    canvas.drawRect(
        Rect.fromLTWH(scanRect.right, scanRect.top,
            size.width - scanRect.right, scanRect.height),
        paint);
    canvas.drawRect(
        Rect.fromLTWH(0, scanRect.bottom, size.width,
            size.height - scanRect.bottom),
        paint);

    final cornerPaint = Paint()
      ..color = AppTheme.accent
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    const cornerLength = 30.0;
    const r = 8.0;

    canvas.drawLine(Offset(scanRect.left + r, scanRect.top),
        Offset(scanRect.left + cornerLength, scanRect.top), cornerPaint);
    canvas.drawLine(Offset(scanRect.left, scanRect.top + r),
        Offset(scanRect.left, scanRect.top + cornerLength), cornerPaint);
    canvas.drawLine(Offset(scanRect.right - cornerLength, scanRect.top),
        Offset(scanRect.right - r, scanRect.top), cornerPaint);
    canvas.drawLine(Offset(scanRect.right, scanRect.top + r),
        Offset(scanRect.right, scanRect.top + cornerLength), cornerPaint);
    canvas.drawLine(Offset(scanRect.left, scanRect.bottom - cornerLength),
        Offset(scanRect.left, scanRect.bottom - r), cornerPaint);
    canvas.drawLine(Offset(scanRect.left + r, scanRect.bottom),
        Offset(scanRect.left + cornerLength, scanRect.bottom), cornerPaint);
    canvas.drawLine(Offset(scanRect.right, scanRect.bottom - cornerLength),
        Offset(scanRect.right, scanRect.bottom - r), cornerPaint);
    canvas.drawLine(Offset(scanRect.right - cornerLength, scanRect.bottom),
        Offset(scanRect.right - r, scanRect.bottom), cornerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
