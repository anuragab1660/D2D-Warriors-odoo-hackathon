import 'package:dio/dio.dart';
import '../core/api_client.dart';
import '../models/dashboard_stats.dart';

class DashboardService {
  final ApiClient _client = ApiClient();

  Future<DashboardStats> getDashboardStats() async {
    try {
      final response = await _client.get('/dashboard');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return DashboardStats.fromJson(data);
      }
      return DashboardStats.empty();
    } on DioException catch (e) {
      final message =
          e.response?.data?['error'] as String? ??
          e.response?.data?['message'] as String? ??
          'Failed to load dashboard data.';
      throw Exception(message);
    }
  }
}
