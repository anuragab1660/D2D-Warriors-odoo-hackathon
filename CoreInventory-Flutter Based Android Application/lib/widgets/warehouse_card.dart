import 'package:flutter/material.dart';
import '../models/warehouse.dart';
import '../utils/app_theme.dart';

class WarehouseCard extends StatelessWidget {
  final Warehouse warehouse;
  final VoidCallback? onTap;

  const WarehouseCard({super.key, required this.warehouse, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.warehouse,
                      color: AppTheme.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        warehouse.name,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary),
                      ),
                      if (warehouse.address != null) ...[
                        const SizedBox(height: 2),
                        Row(children: [
                          const Icon(Icons.location_on_outlined,
                              size: 12, color: AppTheme.textSecondary),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              warehouse.address!,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ]),
                      ],
                    ],
                  ),
                ),
                if (warehouse.shortCode != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      warehouse.shortCode!,
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.grid_view_outlined,
                    size: 13, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '${warehouse.locations.length} location${warehouse.locations.length == 1 ? '' : 's'}',
                  style: const TextStyle(
                      fontSize: 12, color: AppTheme.textSecondary),
                ),
              ]),
              const SizedBox(height: 8),
              const Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('View Locations',
                      style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600)),
                  SizedBox(width: 4),
                  Icon(Icons.chevron_right,
                      color: AppTheme.primary, size: 16),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
