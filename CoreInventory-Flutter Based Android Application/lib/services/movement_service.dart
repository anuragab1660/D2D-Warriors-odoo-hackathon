import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/movement.dart';

class MovementService {
  final ApiClient _client = ApiClient();

  /// Creates a document (receipt/delivery/transfer/adjustment).
  Future<Map<String, dynamic>> createDocument(
      MovementDocument doc) async {
    try {
      final response = await _client.post(
        doc.type.apiEndpoint,
        data: doc.toPayload(),
      );
      return response.data as Map<String, dynamic>? ?? {};
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Used by offline sync — posts a raw payload to an endpoint.
  Future<void> createMovementRaw(
      String endpoint, Map<String, dynamic> payload) async {
    try {
      await _client.post(endpoint, data: payload);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// GET /api/move-history
  Future<List<Movement>> getMovementHistory({
    String? type,
    int? productId,
    String? search,
  }) async {
    try {
      final response = await _client.get(
        '/move-history',
        queryParameters: {
          if (type != null) 'type': type,
          if (productId != null) 'product_id': productId,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      final data = response.data;
      final List<dynamic> items = data is List ? data : [];
      return items
          .map((e) => Movement.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    final message =
        e.response?.data?['error'] as String? ??
        e.response?.data?['message'] as String? ??
        'Movement operation failed.';
    return Exception(message);
  }
}
