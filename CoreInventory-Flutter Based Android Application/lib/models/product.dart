int _pi(dynamic v) => v == null ? 0 : (int.tryParse(v.toString()) ?? 0);
double _pd(dynamic v) => v == null ? 0.0 : (double.tryParse(v.toString()) ?? 0.0);

class StockByLocation {
  final int locationId;
  final String locationName;
  final int warehouseId;
  final String warehouseName;
  final double qty;

  const StockByLocation({
    required this.locationId,
    required this.locationName,
    required this.warehouseId,
    required this.warehouseName,
    required this.qty,
  });

  factory StockByLocation.fromJson(Map<String, dynamic> json) =>
      StockByLocation(
        locationId: _pi(json['location_id']),
        locationName: json['location_name']?.toString() ?? '',
        warehouseId: _pi(json['warehouse_id']),
        warehouseName: json['warehouse_name']?.toString() ?? '',
        qty: _pd(json['qty']),
      );
}

class Product {
  final int id;
  final String name;
  final String sku;
  final String? uom;
  final String category;
  final int? categoryId;
  final double onHand;      // total stock across all locations
  final double freeToUse;   // on_hand minus reserved by pending deliveries
  final double cost;        // per_unit_cost
  final int reorderQty;     // reorder_qty (min stock)
  final bool isLowStock;
  final List<StockByLocation> stockByLocation;

  const Product({
    required this.id,
    required this.name,
    required this.sku,
    this.uom,
    required this.category,
    this.categoryId,
    required this.onHand,
    required this.freeToUse,
    required this.cost,
    required this.reorderQty,
    required this.isLowStock,
    this.stockByLocation = const [],
  });

  /// Convenience accessor used by existing UI widgets
  int get stock => onHand.toInt();

  factory Product.fromJson(Map<String, dynamic> json) {
    final onHand = _pd(json['on_hand'] ?? json['stock']);
    final reorderQty = _pi(json['reorder_qty'] ?? json['min_stock']);
    return Product(
      id: _pi(json['id']),
      name: json['name']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      uom: json['uom']?.toString(),
      category: json['category_name']?.toString() ?? 'Uncategorized',
      categoryId: json['category_id'] == null ? null : _pi(json['category_id']),
      onHand: onHand,
      freeToUse: _pd(json['free_to_use'] ?? json['on_hand']),
      cost: _pd(json['per_unit_cost'] ?? json['cost']),
      reorderQty: reorderQty,
      isLowStock: json['is_low_stock'] == true ||
          json['is_low_stock'] == 'true' ||
          onHand <= reorderQty,
      stockByLocation: (json['stock_by_location'] as List<dynamic>?)
              ?.map((s) => StockByLocation.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'sku': sku,
        'uom': uom,
        'category_name': category,
        'category_id': categoryId,
        'on_hand': onHand,
        'free_to_use': freeToUse,
        'per_unit_cost': cost,
        'reorder_qty': reorderQty,
        'is_low_stock': isLowStock,
      };
}
