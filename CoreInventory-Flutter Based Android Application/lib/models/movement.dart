enum MovementType { receipt, delivery, transfer, adjustment }

extension MovementTypeExtension on MovementType {
  String get label {
    switch (this) {
      case MovementType.receipt:
        return 'Receipt';
      case MovementType.delivery:
        return 'Delivery';
      case MovementType.transfer:
        return 'Transfer';
      case MovementType.adjustment:
        return 'Adjustment';
    }
  }

  String get apiEndpoint {
    switch (this) {
      case MovementType.receipt:
        return '/receipts';
      case MovementType.delivery:
        return '/deliveries';
      case MovementType.transfer:
        return '/transfers';
      case MovementType.adjustment:
        return '/adjustments';
    }
  }

  static MovementType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'receipt':
        return MovementType.receipt;
      case 'delivery':
        return MovementType.delivery;
      case 'transfer':
        return MovementType.transfer;
      default:
        return MovementType.adjustment;
    }
  }
}

/// Matches a row from GET /api/move-history
class Movement {
  final int? id;
  final String? ref;
  final MovementType type;
  final int productId;
  final String? productName;
  final int? fromLocationId;
  final String? fromLocationName;
  final int? toLocationId;
  final String? toLocationName;
  final double qty;
  final DateTime? date;

  const Movement({
    this.id,
    this.ref,
    required this.type,
    required this.productId,
    this.productName,
    this.fromLocationId,
    this.fromLocationName,
    this.toLocationId,
    this.toLocationName,
    required this.qty,
    this.date,
  });

  /// Legacy accessor used by widgets
  int get quantity => qty.toInt();

  static int? _piOpt(dynamic v) =>
      v == null ? null : (int.tryParse(v.toString()) ?? 0);
  static int _pi(dynamic v) => v == null ? 0 : (int.tryParse(v.toString()) ?? 0);
  static double _pd(dynamic v) =>
      v == null ? 0.0 : (double.tryParse(v.toString()) ?? 0.0);

  factory Movement.fromJson(Map<String, dynamic> json) => Movement(
        id: _piOpt(json['id']),
        ref: json['ref']?.toString(),
        type: MovementTypeExtension.fromString(
            json['type']?.toString() ?? 'adjustment'),
        productId: _pi(json['product_id']),
        productName: json['product_name']?.toString(),
        fromLocationId: _piOpt(json['from_location_id']),
        fromLocationName: json['from_location_name']?.toString(),
        toLocationId: _piOpt(json['to_location_id']),
        toLocationName: json['to_location_name']?.toString(),
        qty: _pd(json['qty'] ?? json['quantity']),
        date: json['date'] != null
            ? DateTime.tryParse(json['date'].toString())
            : null,
      );

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        if (ref != null) 'ref': ref,
        'type': type.label.toLowerCase(),
        'product_id': productId,
        'qty': qty,
        if (fromLocationId != null) 'from_location_id': fromLocationId,
        if (toLocationId != null) 'to_location_id': toLocationId,
      };
}

// ── Document-level models for creating movements ─────────────────────────────

class MovementLine {
  final int productId;
  final String? productName;
  final String? productSku;
  final double qty;

  const MovementLine({
    required this.productId,
    this.productName,
    this.productSku,
    required this.qty,
  });

  Map<String, dynamic> toReceiptLine() => {
        'product_id': productId,
        'expected_qty': qty,
        'received_qty': 0,
      };

  Map<String, dynamic> toDeliveryLine() => {
        'product_id': productId,
        'qty_demanded': qty,
      };

  Map<String, dynamic> toTransferLine() => {
        'product_id': productId,
        'qty': qty,
      };

  Map<String, dynamic> toAdjustmentLine() => {
        'product_id': productId,
        'counted_qty': qty,
      };
}

class MovementDocument {
  final MovementType type;
  final int? locationId;          // destination (receipt/delivery/adjustment)
  final int? fromLocationId;      // transfer source
  final int? toLocationId;        // transfer destination
  final String? supplierOrDest;   // supplier (receipt) or destination (delivery)
  final String? notes;
  final List<MovementLine> lines;

  const MovementDocument({
    required this.type,
    this.locationId,
    this.fromLocationId,
    this.toLocationId,
    this.supplierOrDest,
    this.notes,
    required this.lines,
  });

  Map<String, dynamic> toPayload() {
    final today = DateTime.now().toIso8601String().split('T').first;
    switch (type) {
      case MovementType.receipt:
        return {
          'supplier': supplierOrDest,
          'location_id': locationId,
          'notes': notes,
          'date': today,
          'lines': lines.map((l) => l.toReceiptLine()).toList(),
        };
      case MovementType.delivery:
        return {
          'destination': supplierOrDest,
          'location_id': locationId,
          'notes': notes,
          'date': today,
          'lines': lines.map((l) => l.toDeliveryLine()).toList(),
        };
      case MovementType.transfer:
        return {
          'from_location_id': fromLocationId,
          'to_location_id': toLocationId,
          'notes': notes,
          'date': today,
          'lines': lines.map((l) => l.toTransferLine()).toList(),
        };
      case MovementType.adjustment:
        return {
          'location_id': locationId,
          'notes': notes,
          'date': today,
          'lines': lines.map((l) => l.toAdjustmentLine()).toList(),
        };
    }
  }
}

/// Offline queue entry stored in Hive while device is offline.
class PendingMovement {
  final String id;
  final Map<String, dynamic> payload;
  final String endpoint;
  final DateTime createdAt;

  const PendingMovement({
    required this.id,
    required this.payload,
    required this.endpoint,
    required this.createdAt,
  });

  factory PendingMovement.fromJson(Map<String, dynamic> json) =>
      PendingMovement(
        id: json['id'] as String,
        payload: Map<String, dynamic>.from(json['payload'] as Map),
        endpoint: json['endpoint'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'payload': payload,
        'endpoint': endpoint,
        'created_at': createdAt.toIso8601String(),
      };
}
