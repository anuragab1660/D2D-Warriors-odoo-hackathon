import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/warehouse.dart';
import '../models/location.dart';

class WarehouseService {
  final ApiClient _client = ApiClient();

  Future<List<Warehouse>> getWarehouses() async {
    try {
      final response = await _client.get('/warehouses');
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map) {
        items = data['data'] as List<dynamic>? ??
            data['warehouses'] as List<dynamic>? ??
            [];
      } else {
        items = [];
      }
      return items
          .map((e) => Warehouse.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Warehouse> getWarehouseById(int id) async {
    try {
      final response = await _client.get('/warehouses/$id');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return Warehouse.fromJson(
            data['data'] as Map<String, dynamic>? ?? data);
      }
      throw Exception('Invalid warehouse response');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Location>> getLocations({int? warehouseId}) async {
    try {
      final response = await _client.get(
        '/locations',
        queryParameters: {
          if (warehouseId != null) 'warehouse_id': warehouseId,
        },
      );
      final data = response.data;
      List<dynamic> items;
      if (data is List) {
        items = data;
      } else if (data is Map) {
        items = data['data'] as List<dynamic>? ??
            data['locations'] as List<dynamic>? ??
            [];
      } else {
        items = [];
      }
      return items
          .map((e) => Location.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    final message = e.response?.data?['message'] as String? ??
        e.response?.data?['error'] as String? ??
        'An error occurred while fetching warehouse data.';
    return Exception(message);
  }
}
