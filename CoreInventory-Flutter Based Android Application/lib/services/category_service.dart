import '../core/api_client.dart';
import '../models/category.dart';

class CategoryService {
  final ApiClient _client = ApiClient();

  Future<List<Category>> getCategories() async {
    final response = await _client.get('/categories');
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      final msg = _extractError(response.data);
      throw Exception(msg ?? 'Failed to load categories (HTTP $status).');
    }
    final data = response.data;
    List<dynamic> list;
    if (data is List) {
      list = data;
    } else if (data is Map && data['data'] is List) {
      list = data['data'] as List;
    } else if (data is Map && data['categories'] is List) {
      list = data['categories'] as List;
    } else {
      list = [];
    }
    return list
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Category> createCategory({required String name}) async {
    final response = await _client.post('/categories', data: {'name': name});
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      final msg = _extractError(response.data);
      throw Exception(msg ?? 'Failed to create category (HTTP $status).');
    }
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final payload = data['data'] is Map<String, dynamic>
          ? data['data'] as Map<String, dynamic>
          : data;
      return Category.fromJson(payload as Map<String, dynamic>);
    }
    throw Exception('Unexpected response format.');
  }

  Future<Category> updateCategory(
      {required int id, required String name}) async {
    final response =
        await _client.put('/categories/$id', data: {'name': name});
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      final msg = _extractError(response.data);
      throw Exception(msg ?? 'Failed to update category (HTTP $status).');
    }
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final payload = data['data'] is Map<String, dynamic>
          ? data['data'] as Map<String, dynamic>
          : data;
      return Category.fromJson(payload as Map<String, dynamic>);
    }
    throw Exception('Unexpected response format.');
  }

  Future<void> deleteCategory(int id) async {
    final response = await _client.delete('/categories/$id');
    final status = response.statusCode ?? 0;
    if (status < 200 || status >= 300) {
      final msg = _extractError(response.data);
      throw Exception(msg ?? 'Failed to delete category (HTTP $status).');
    }
  }

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
