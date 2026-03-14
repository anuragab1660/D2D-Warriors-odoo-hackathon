import 'package:flutter/material.dart';
import '../models/product.dart';
import '../utils/app_theme.dart';
import 'movement_screen.dart';

class ProductDetailScreen extends StatelessWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: Text(product.name)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.inventory_2,
                            color: AppTheme.primary, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(product.name,
                                style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary)),
                            const SizedBox(height: 4),
                            Row(children: [
                              _Chip(product.category),
                              if (product.uom != null) ...[
                                const SizedBox(width: 6),
                                _Chip(product.uom!,
                                    color: AppTheme.info),
                              ],
                            ]),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 12),
                    _Row(Icons.qr_code, 'SKU', product.sku),
                    const SizedBox(height: 10),
                    _Row(Icons.inventory, 'On Hand',
                        '${product.onHand.toStringAsFixed(0)} units',
                        valueColor: product.isLowStock
                            ? AppTheme.error
                            : AppTheme.accent),
                    const SizedBox(height: 10),
                    _Row(Icons.lock_clock_outlined, 'Free to Use',
                        '${product.freeToUse.toStringAsFixed(0)} units'),
                    const SizedBox(height: 10),
                    _Row(Icons.attach_money, 'Unit Cost',
                        '\$${product.cost.toStringAsFixed(2)}'),
                    const SizedBox(height: 10),
                    _Row(Icons.warning_amber_outlined, 'Reorder Point',
                        '${product.reorderQty} units'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Low-stock warning
            if (product.isLowStock)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: AppTheme.warning.withValues(alpha: 0.3)),
                ),
                child: const Row(children: [
                  Icon(Icons.warning_amber, color: AppTheme.warning, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Stock is at or below the reorder point. Consider replenishing.',
                      style:
                          TextStyle(color: AppTheme.warning, fontSize: 13),
                    ),
                  ),
                ]),
              ),

            // Stock by location
            if (product.stockByLocation.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Stock by Location',
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 10),
                      ...product.stockByLocation.map((s) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(children: [
                              const Icon(Icons.location_on_outlined,
                                  size: 14, color: AppTheme.textSecondary),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  '${s.warehouseName} › ${s.locationName}',
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ),
                              Text(
                                '${s.qty.toStringAsFixed(0)} ${product.uom ?? 'pcs'}',
                                style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimary),
                              ),
                            ]),
                          )),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Total value card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Stock Value',
                        style: TextStyle(
                            fontSize: 15, color: AppTheme.textSecondary)),
                    Text(
                      '\$${(product.onHand * product.cost).toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => MovementScreen(product: product)),
              ),
              icon: const Icon(Icons.swap_horiz),
              label: const Text('Record Movement'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Back to Products'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _Row(this.icon, this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(icon, size: 16, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 13, color: AppTheme.textSecondary))),
        Expanded(
          child: Text(value,
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: valueColor ?? AppTheme.textPrimary)),
        ),
      ]);
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip(this.label, {this.color = AppTheme.accent});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12, color: color, fontWeight: FontWeight.w500)),
      );
}
