/// Matches the actual GET /api/dashboard response from the CoreInventory backend.
class DashboardStats {
  final int totalProducts;
  final int lowStockCount;
  final int pendingReceipts;
  final int pendingDeliveries;
  final int pendingTransfers;
  final DocBreakdown receiptBreakdown;
  final DocBreakdown deliveryBreakdown;
  final List<TodayDoc> todayReceipts;
  final List<TodayDoc> todayDeliveries;
  final List<LowStockProduct> lowStockProducts;

  const DashboardStats({
    required this.totalProducts,
    required this.lowStockCount,
    required this.pendingReceipts,
    required this.pendingDeliveries,
    required this.pendingTransfers,
    required this.receiptBreakdown,
    required this.deliveryBreakdown,
    required this.todayReceipts,
    required this.todayDeliveries,
    required this.lowStockProducts,
  });

  static int _parseInt(dynamic v) =>
      v == null ? 0 : (int.tryParse(v.toString()) ?? 0);

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        totalProducts: _parseInt(json['totalProducts']),
        lowStockCount: _parseInt(json['lowStockCount']),
        pendingReceipts: _parseInt(json['pendingReceipts']),
        pendingDeliveries: _parseInt(json['pendingDeliveries']),
        pendingTransfers: _parseInt(json['pendingTransfers']),
        receiptBreakdown: json['receiptBreakdown'] != null
            ? DocBreakdown.fromJson(
                json['receiptBreakdown'] as Map<String, dynamic>)
            : const DocBreakdown(),
        deliveryBreakdown: json['deliveryBreakdown'] != null
            ? DocBreakdown.fromJson(
                json['deliveryBreakdown'] as Map<String, dynamic>)
            : const DocBreakdown(),
        todayReceipts: (json['todayReceipts'] as List<dynamic>? ?? [])
            .map((e) => TodayDoc.fromJson(e as Map<String, dynamic>))
            .toList(),
        todayDeliveries: (json['todayDeliveries'] as List<dynamic>? ?? [])
            .map((e) => TodayDoc.fromJson(e as Map<String, dynamic>))
            .toList(),
        lowStockProducts:
            (json['lowStockProducts'] as List<dynamic>? ?? [])
                .map((e) =>
                    LowStockProduct.fromJson(e as Map<String, dynamic>))
                .toList(),
      );

  factory DashboardStats.empty() => const DashboardStats(
        totalProducts: 0,
        lowStockCount: 0,
        pendingReceipts: 0,
        pendingDeliveries: 0,
        pendingTransfers: 0,
        receiptBreakdown: DocBreakdown(),
        deliveryBreakdown: DocBreakdown(),
        todayReceipts: [],
        todayDeliveries: [],
        lowStockProducts: [],
      );
}

class DocBreakdown {
  final int late;
  final int waiting;
  final int operations;
  final int toProcess; // toReceive or toDeliver

  const DocBreakdown({
    this.late = 0,
    this.waiting = 0,
    this.operations = 0,
    this.toProcess = 0,
  });

  factory DocBreakdown.fromJson(Map<String, dynamic> json) => DocBreakdown(
        late: DashboardStats._parseInt(json['late']),
        waiting: DashboardStats._parseInt(json['waiting']),
        operations: DashboardStats._parseInt(json['operations']),
        toProcess: DashboardStats._parseInt(
            json['toReceive'] ?? json['toDeliver']),
      );
}

class TodayDoc {
  final String ref;
  final String? party; // supplier or destination
  final String status;
  final String? locationName;
  final String? date;

  const TodayDoc({
    required this.ref,
    this.party,
    required this.status,
    this.locationName,
    this.date,
  });

  factory TodayDoc.fromJson(Map<String, dynamic> json) => TodayDoc(
        ref: json['ref'] as String? ?? '',
        party: json['supplier'] as String? ?? json['destination'] as String?,
        status: json['status'] as String? ?? '',
        locationName: json['location_name'] as String?,
        date: json['date'] as String?,
      );
}

class LowStockProduct {
  final int id;
  final String name;
  final String sku;
  final double onHand;
  final int reorderQty;

  const LowStockProduct({
    required this.id,
    required this.name,
    required this.sku,
    required this.onHand,
    required this.reorderQty,
  });

  factory LowStockProduct.fromJson(Map<String, dynamic> json) =>
      LowStockProduct(
        id: DashboardStats._parseInt(json['id']),
        name: json['name']?.toString() ?? '',
        sku: json['sku']?.toString() ?? '',
        onHand: double.tryParse(json['on_hand']?.toString() ?? '0') ?? 0.0,
        reorderQty: DashboardStats._parseInt(json['reorder_qty']),
      );
}
