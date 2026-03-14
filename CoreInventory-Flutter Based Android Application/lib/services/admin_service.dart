import '../core/api_client.dart';
import '../models/warehouse.dart';
import '../models/location.dart';

class AdminService {
  final ApiClient _client = ApiClient();

  // ── Warehouse CRUD ──────────────────────────────────────────────────────────

  Future<Warehouse> createWarehouse({
    required String name,
    required String shortCode,
    String? address,
  }) async {
    final body = {
      'name': name,
      'short_code': shortCode,
      if (address != null && address.isNotEmpty) 'address': address,
    };
    final response = await _client.post('/warehouses', data: body);
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw Exception(_extractError(response.data) ??
          'Failed to create warehouse (HTTP $status).');
    }
    return _parseWarehouse(response.data);
  }

  Future<Warehouse> updateWarehouse({
    required int id,
    required String name,
    required String shortCode,
    String? address,
  }) async {
    final body = {
      'name': name,
      'short_code': shortCode,
      if (address != null && address.isNotEmpty) 'address': address,
    };
    final response = await _client.put('/warehouses/$id', data: body);
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw Exception(_extractError(response.data) ??
          'Failed to update warehouse (HTTP $status).');
    }
    return _parseWarehouse(response.data);
  }

  Future<void> deleteWarehouse(int id) async {
    final response = await _client.delete('/warehouses/$id');
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw Exception(_extractError(response.data) ??
          'Failed to delete warehouse (HTTP $status).');
    }
  }

  // ── Location CRUD ───────────────────────────────────────────────────────────

  Future<Location> createLocation({
    required int warehouseId,
    required String name,
    String? shortCode,
  }) async {
    final body = {
      'warehouse_id': warehouseId,
      'name': name,
      if (shortCode != null && shortCode.isNotEmpty) 'short_code': shortCode,
    };
    final response = await _client.post('/locations', data: body);
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw Exception(_extractError(response.data) ??
          'Failed to create location (HTTP $status).');
    }
    return _parseLocation(response.data);
  }

  Future<Location> updateLocation({
    required int id,
    required String name,
    String? shortCode,
    required int warehouseId,
  }) async {
    final body = {
      'name': name,
      'warehouse_id': warehouseId,
      if (shortCode != null && shortCode.isNotEmpty) 'short_code': shortCode,
    };
    final response = await _client.put('/locations/$id', data: body);
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw Exception(_extractError(response.data) ??
          'Failed to update location (HTTP $status).');
    }
    return _parseLocation(response.data);
  }

  Future<void> deleteLocation(int id) async {
    final response = await _client.delete('/locations/$id');
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      throw Exception(_extractError(response.data) ??
          'Failed to delete location (HTTP $status).');
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  Warehouse _parseWarehouse(dynamic data) {
    if (data is Map<String, dynamic>) {
      final payload = data['data'] is Map<String, dynamic>
          ? data['data'] as Map<String, dynamic>
          : data;
      return Warehouse.fromJson(payload);
    }
    throw Exception('Unexpected response format for warehouse.');
  }

  Location _parseLocation(dynamic data) {
    if (data is Map<String, dynamic>) {
      final payload = data['data'] is Map<String, dynamic>
          ? data['data'] as Map<String, dynamic>
          : data;
      return _locationFromJson(payload);
    }
    throw Exception('Unexpected response format for location.');
  }

  Location _locationFromJson(Map<String, dynamic> json) => Location(
        id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
        name: json['name']?.toString() ?? '',
        warehouseId:
            int.tryParse(json['warehouse_id']?.toString() ?? '0') ?? 0,
        shortCode: json['short_code']?.toString(),
        warehouseName: json['warehouse_name']?.toString(),
        warehouseShortCode: json['warehouse_short_code']?.toString(),
      );

  String? _extractError(dynamic data) {
    if (data is Map) {
      for (final key in ['message', 'error', 'msg', 'detail']) {
        if (data[key] is String && (data[key] as String).isNotEmpty) {
          return data[key] as String;
        }
      }
    }
    if (data is String && data.isNotEmpty) return data;
    return null;
  }
}
