import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/product.dart';

class ProductService {
  final ApiClient _client = ApiClient();

  Future<List<Product>> getProducts({
    String? search,
    int? categoryId,
  }) async {
    try {
      final response = await _client.get(
        '/products',
        queryParameters: {
          if (search != null && search.isNotEmpty) 'search': search,
          if (categoryId != null) 'category_id': categoryId,
        },
      );
      final data = response.data;
      final List<dynamic> items = data is List ? data : [];
      return items
          .map((e) => Product.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Product> getProductById(int id) async {
    try {
      final response = await _client.get('/products/$id');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return Product.fromJson(data);
      }
      throw Exception('Invalid product response');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Product?> getProductBySku(String sku) async {
    try {
      final products = await getProducts(search: sku);
      // Find exact SKU match
      final exact = products.where(
        (p) => p.sku.toLowerCase() == sku.toLowerCase(),
      );
      if (exact.isNotEmpty) return exact.first;
      if (products.isNotEmpty) return products.first;
      return null;
    } catch (_) {
      return null;
    }
  }

  Exception _handleError(DioException e) {
    final message =
        e.response?.data?['error'] as String? ??
        e.response?.data?['message'] as String? ??
        'An error occurred while fetching products.';
    return Exception(message);
  }
}
