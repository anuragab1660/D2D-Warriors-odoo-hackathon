import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/movement.dart';
import '../utils/app_theme.dart';

class MovementTile extends StatelessWidget {
  final Movement movement;

  const MovementTile({super.key, required this.movement});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: _typeColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_typeIcon, color: _typeColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: _typeColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        movement.type.label.toUpperCase(),
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _typeColor),
                      ),
                    ),
                    if (movement.ref != null) ...[
                      const SizedBox(width: 8),
                      Text('#${movement.ref}',
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary)),
                    ],
                  ]),
                  const SizedBox(height: 5),
                  Text(
                    movement.productName ??
                        'Product #${movement.productId}',
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  // Location flow
                  if (movement.fromLocationName != null ||
                      movement.toLocationName != null)
                    Row(children: [
                      if (movement.fromLocationName != null)
                        Flexible(
                          child: Row(children: [
                            const Icon(Icons.arrow_upward,
                                size: 11,
                                color: AppTheme.textSecondary),
                            const SizedBox(width: 2),
                            Flexible(
                              child: Text(movement.fromLocationName!,
                                  style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.textSecondary),
                                  overflow: TextOverflow.ellipsis),
                            ),
                          ]),
                        ),
                      if (movement.fromLocationName != null &&
                          movement.toLocationName != null)
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4),
                          child: Icon(Icons.arrow_forward,
                              size: 11, color: AppTheme.textSecondary),
                        ),
                      if (movement.toLocationName != null)
                        Flexible(
                          child: Row(children: [
                            const Icon(Icons.arrow_downward,
                                size: 11,
                                color: AppTheme.textSecondary),
                            const SizedBox(width: 2),
                            Flexible(
                              child: Text(movement.toLocationName!,
                                  style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.textSecondary),
                                  overflow: TextOverflow.ellipsis),
                            ),
                          ]),
                        ),
                    ]),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '$_prefix${movement.qty.toStringAsFixed(0)}',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _typeColor),
                ),
                if (movement.date != null) ...[
                  const SizedBox(height: 4),
                  Text(DateFormat('MMM d').format(movement.date!),
                      style: const TextStyle(
                          fontSize: 11, color: AppTheme.textSecondary)),
                  Text(DateFormat('HH:mm').format(movement.date!),
                      style: const TextStyle(
                          fontSize: 11, color: AppTheme.textSecondary)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color get _typeColor {
    switch (movement.type) {
      case MovementType.receipt:
        return AppTheme.accent;
      case MovementType.delivery:
        return AppTheme.error;
      case MovementType.transfer:
        return AppTheme.info;
      case MovementType.adjustment:
        return AppTheme.warning;
    }
  }

  IconData get _typeIcon {
    switch (movement.type) {
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

  String get _prefix {
    switch (movement.type) {
      case MovementType.receipt:
        return '+';
      case MovementType.delivery:
        return '-';
      default:
        return '';
    }
  }
}
