class Location {
  final int id;
  final String name;
  final int warehouseId;
  final String? shortCode;
  final String? warehouseName;
  final String? warehouseShortCode;

  const Location({
    required this.id,
    required this.name,
    required this.warehouseId,
    this.shortCode,
    this.warehouseName,
    this.warehouseShortCode,
  });

  String get displayName =>
      warehouseName != null ? '$warehouseName › $name' : name;

  factory Location.fromJson(Map<String, dynamic> json) => Location(
        id: json['id'] as int,
        name: json['name'] as String,
        warehouseId: json['warehouse_id'] as int,
        shortCode: json['short_code'] as String?,
        warehouseName: json['warehouse_name'] as String?,
        warehouseShortCode: json['warehouse_short_code'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'warehouse_id': warehouseId,
        'short_code': shortCode,
        'warehouse_name': warehouseName,
        'warehouse_short_code': warehouseShortCode,
      };
}
