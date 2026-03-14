import 'location.dart';

class Warehouse {
  final int id;
  final String name;
  final String? shortCode;
  final String? address;
  final List<Location> locations;

  const Warehouse({
    required this.id,
    required this.name,
    this.shortCode,
    this.address,
    this.locations = const [],
  });

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
        id: json['id'] as int,
        name: json['name'] as String,
        shortCode: json['short_code'] as String?,
        address: json['address'] as String?,
        locations: (json['locations'] as List<dynamic>?)
                ?.map((l) => Location.fromJson(l as Map<String, dynamic>))
                .toList() ??
            [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'short_code': shortCode,
        'address': address,
        'locations': locations.map((l) => l.toJson()).toList(),
      };
}
