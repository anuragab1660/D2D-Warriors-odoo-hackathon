import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/movement.dart';
import '../models/location.dart';
import '../providers/movement_provider.dart';
import '../providers/warehouse_provider.dart';
import '../providers/product_provider.dart';
import '../utils/app_theme.dart';
import '../utils/pdf_generator.dart';

class MovementScreen extends StatefulWidget {
  final Product? product; // pre-selected when coming from product detail
  final MovementType? preSelectedType; // pre-selected movement type from drawer

  const MovementScreen({super.key, this.product, this.preSelectedType});

  @override
  State<MovementScreen> createState() => _MovementScreenState();
}

class _MovementScreenState extends State<MovementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _partyController = TextEditingController();
  final _notesController = TextEditingController();

  late MovementType _type;
  Location? _location;
  Location? _fromLocation;
  Location? _toLocation;

  // Product lines
  final List<_LineEntry> _lines = [];

  @override
  void initState() {
    super.initState();
    _type = widget.preSelectedType ?? MovementType.receipt;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WarehouseProvider>().fetchLocations();
      if (widget.product != null) {
        _lines.add(_LineEntry(product: widget.product!));
      }
    });
  }

  @override
  void dispose() {
    _partyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_lines.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Add at least one product line.'),
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
    for (final l in _lines) {
      if (l.qty <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('All quantities must be greater than 0.'),
            backgroundColor: AppTheme.error));
        return;
      }
    }

    final doc = MovementDocument(
      type: _type,
      locationId: _location?.id,
      fromLocationId: _fromLocation?.id,
      toLocationId: _toLocation?.id,
      supplierOrDest: _partyController.text.trim().isNotEmpty
          ? _partyController.text.trim()
          : null,
      notes: _notesController.text.trim().isNotEmpty
          ? _notesController.text.trim()
          : null,
      lines: _lines
          .map((e) => MovementLine(
                productId: e.product.id,
                productName: e.product.name,
                productSku: e.product.sku,
                qty: e.qty,
              ))
          .toList(),
    );

    final success = await context.read<MovementProvider>().createDocument(doc);
    if (!mounted) return;

    final movProv = context.read<MovementProvider>();
    if (success) {
      final serverResponse = movProv.lastCreatedResponse ?? {};
      movProv.clearMessages();
      await _showSuccessDialog(doc, serverResponse);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(movProv.errorMessage ?? 'Failed to create.'),
          backgroundColor: AppTheme.error));
      movProv.clearMessages();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Record Movement')),
      body: Consumer<WarehouseProvider>(
        builder: (_, whProv, __) {
          final locations = whProv.locations;
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // ── Type selector ────────────────────────────────────
                const _SectionLabel('Movement Type'),
                const SizedBox(height: 8),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.8,
                  children: MovementType.values.map((t) {
                    final sel = _type == t;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _type = t;
                        _location = null;
                        _fromLocation = null;
                        _toLocation = null;
                      }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: sel ? AppTheme.primary : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color:
                                  sel ? AppTheme.primary : AppTheme.border),
                        ),
                        child: Row(children: [
                          Icon(_typeIcon(t),
                              size: 16,
                              color: sel
                                  ? Colors.white
                                  : AppTheme.textSecondary),
                          const SizedBox(width: 6),
                          Text(t.label,
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: sel
                                      ? Colors.white
                                      : AppTheme.textPrimary)),
                        ]),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),

                // ── Party name (supplier / destination) ───────────────
                if (_type == MovementType.receipt ||
                    _type == MovementType.delivery) ...[
                  TextFormField(
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

                // ── Location pickers ──────────────────────────────────
                if (_type == MovementType.transfer) ...[
                  _LocationDropdown(
                    label: 'From Location *',
                    value: _fromLocation,
                    locations: locations,
                    onChanged: (v) => setState(() => _fromLocation = v),
                  ),
                  const SizedBox(height: 12),
                  _LocationDropdown(
                    label: 'To Location *',
                    value: _toLocation,
                    locations: locations
                        .where((l) => l.id != _fromLocation?.id)
                        .toList(),
                    onChanged: (v) => setState(() => _toLocation = v),
                  ),
                ] else ...[
                  _LocationDropdown(
                    label: 'Location *',
                    value: _location,
                    locations: locations,
                    onChanged: (v) => setState(() => _location = v),
                  ),
                ],
                const SizedBox(height: 16),

                // ── Product lines ─────────────────────────────────────
                Row(
                  children: [
                    const _SectionLabel('Products'),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () => _addLine(context),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Product'),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                if (_lines.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Center(
                      child: Text('No products added yet.',
                          style:
                              TextStyle(color: AppTheme.textSecondary)),
                    ),
                  )
                else
                  ...List.generate(_lines.length, (i) {
                    final line = _lines[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(line.product.name,
                                    style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600)),
                                Text(
                                    '${line.product.sku} • Stock: ${line.product.onHand.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 80,
                            child: TextFormField(
                              initialValue: line.qty > 0
                                  ? line.qty.toStringAsFixed(0)
                                  : '',
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              decoration: const InputDecoration(
                                labelText: 'Qty',
                                contentPadding: EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 10),
                              ),
                              onChanged: (v) {
                                final n = double.tryParse(v) ?? 0;
                                setState(() => _lines[i] =
                                    _LineEntry(product: line.product, qty: n));
                              },
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline,
                                color: AppTheme.error, size: 20),
                            onPressed: () =>
                                setState(() => _lines.removeAt(i)),
                          ),
                        ]),
                      ),
                    );
                  }),
                const SizedBox(height: 16),

                // ── Notes ─────────────────────────────────────────────
                TextFormField(
                  controller: _notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Notes (optional)',
                    prefixIcon: Icon(Icons.notes),
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 24),

                // ── Submit ────────────────────────────────────────────
                Consumer<MovementProvider>(
                  builder: (_, prov, __) => ElevatedButton.icon(
                    onPressed:
                        prov.state == LoadingState.loading ? null : _submit,
                    icon: prov.state == LoadingState.loading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.check_circle_outline),
                    label: Text(prov.state == LoadingState.loading
                        ? 'Saving...'
                        : 'Create ${_type.label}'),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _showSuccessDialog(
      MovementDocument doc, Map<String, dynamic> serverResponse) async {
    final ref = serverResponse['ref']?.toString() ??
        serverResponse['id']?.toString();
    await showDialog(
      context: context,
      barrierDismissible: false,
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
            Text(
              '${doc.type.label} Created!',
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary),
            ),
            if (ref != null) ...[
              const SizedBox(height: 6),
              Text('Ref: $ref',
                  style: const TextStyle(
                      fontSize: 13, color: AppTheme.textSecondary)),
            ],
            const SizedBox(height: 6),
            Text(
              '${doc.lines.length} product line${doc.lines.length == 1 ? '' : 's'} • '
              'Total qty: ${doc.lines.fold<double>(0, (s, l) => s + l.qty).toStringAsFixed(0)}',
              style: const TextStyle(
                  fontSize: 12, color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
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
              if (mounted) Navigator.of(context).pop();
            },
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('Download PDF'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop(); // close dialog
              Navigator.of(context).pop(); // close movement screen
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _addLine(BuildContext context) async {
    final products = context.read<ProductProvider>().products;
    if (products.isEmpty) {
      await context.read<ProductProvider>().fetchProducts();
    }

    if (!mounted) return;
    final allProducts = context.read<ProductProvider>().products;

    final Product? selected = await showModalBottomSheet<Product>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _ProductPickerSheet(products: allProducts),
    );

    if (selected != null) {
      // Don't add duplicates
      if (_lines.any((l) => l.product.id == selected.id)) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Product already added.')));
        return;
      }
      setState(() => _lines.add(_LineEntry(product: selected)));
    }
  }

  IconData _typeIcon(MovementType t) {
    switch (t) {
      case MovementType.receipt:
        return Icons.move_to_inbox_outlined;
      case MovementType.delivery:
        return Icons.local_shipping_outlined;
      case MovementType.transfer:
        return Icons.swap_horiz;
      case MovementType.adjustment:
        return Icons.tune;
    }
  }
}

// ── Helper data class ─────────────────────────────────────────────────────────
class _LineEntry {
  final Product product;
  final double qty;
  _LineEntry({required this.product, this.qty = 0});
}

// ── Location dropdown ─────────────────────────────────────────────────────────
class _LocationDropdown extends StatelessWidget {
  final String label;
  final Location? value;
  final List<Location> locations;
  final ValueChanged<Location?> onChanged;

  const _LocationDropdown({
    required this.label,
    required this.value,
    required this.locations,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
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
                child:
                    Text(l.displayName, overflow: TextOverflow.ellipsis),
              ))
          .toList(),
      onChanged: onChanged,
    );
  }
}

// ── Section label ─────────────────────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary),
      );
}

// ── Product picker bottom sheet ───────────────────────────────────────────────
class _ProductPickerSheet extends StatefulWidget {
  final List<Product> products;
  const _ProductPickerSheet({required this.products});

  @override
  State<_ProductPickerSheet> createState() => _ProductPickerSheetState();
}

class _ProductPickerSheetState extends State<_ProductPickerSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final filtered = _query.isEmpty
        ? widget.products
        : widget.products
            .where((p) =>
                p.name.toLowerCase().contains(_query.toLowerCase()) ||
                p.sku.toLowerCase().contains(_query.toLowerCase()))
            .toList();

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (_, scroll) => Column(children: [
        const SizedBox(height: 8),
        Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            autofocus: true,
            onChanged: (v) => setState(() => _query = v),
            decoration: const InputDecoration(
              hintText: 'Search products...',
              prefixIcon: Icon(Icons.search),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            controller: scroll,
            itemCount: filtered.length,
            itemBuilder: (_, i) {
              final p = filtered[i];
              return ListTile(
                title: Text(p.name,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500)),
                subtitle: Text(
                    '${p.sku} • Stock: ${p.onHand.toStringAsFixed(0)}'),
                trailing: p.isLowStock
                    ? const Icon(Icons.warning_amber,
                        color: AppTheme.warning, size: 16)
                    : null,
                onTap: () => Navigator.of(context).pop(p),
              );
            },
          ),
        ),
      ]),
    );
  }
}
