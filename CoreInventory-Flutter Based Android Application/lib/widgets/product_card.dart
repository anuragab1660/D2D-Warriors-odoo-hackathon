import 'package:flutter/material.dart';
import '../models/product.dart';
import '../utils/app_theme.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductCard({super.key, required this.product, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Low-stock indicator bar
              Container(
                width: 4,
                height: 52,
                decoration: BoxDecoration(
                  color: product.isLowStock
                      ? AppTheme.error
                      : AppTheme.accent,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(
                        child: Text(
                          product.name,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (product.isLowStock)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('LOW',
                              style: TextStyle(
                                  fontSize: 10,
                                  color: AppTheme.error,
                                  fontWeight: FontWeight.bold)),
                        ),
                    ]),
                    const SizedBox(height: 4),
                    Row(children: [
                      Text(product.sku,
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary)),
                      const SizedBox(width: 6),
                      Container(
                          width: 3,
                          height: 3,
                          decoration: const BoxDecoration(
                              color: AppTheme.border,
                              shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(product.category,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondary),
                            overflow: TextOverflow.ellipsis),
                      ),
                    ]),
                    if (product.uom != null)
                      Text(product.uom!,
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    product.onHand.toStringAsFixed(0),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: product.isLowStock
                          ? AppTheme.error
                          : AppTheme.textPrimary,
                    ),
                  ),
                  Text(
                    product.uom ?? 'units',
                    style: const TextStyle(
                        fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right,
                  color: AppTheme.textSecondary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
