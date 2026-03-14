import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../utils/constants.dart';

class AuthService {
  final ApiClient _client = ApiClient();

  Future<String> login({
    required String email,
    required String password,
  }) async {
    try {
      debugPrint('[AuthService] Attempting login for: $email');
      final url = '${AppConstants.baseUrl}/auth/login';
      debugPrint('[AuthService] POST $url');

      // Use ResponseType.bytes so Dio returns raw bytes regardless of
      // Content-Type header — Render's proxy can't interfere with this.
      final freshDio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        validateStatus: (_) => true,
        responseType: ResponseType.bytes,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': '*/*',
        },
      ))..interceptors.add(LogInterceptor(
          requestBody: true,
          responseBody: true,
          requestHeader: true,
          responseHeader: true,
          logPrint: (o) => debugPrint('[LoginDio] $o'),
        ));

      final response = await freshDio.post(
        url,
        data: jsonEncode({'email': email, 'password': password}),
      );

      final statusCode = response.statusCode ?? 0;
      final rawBytes = response.data as List<int>? ?? [];
      final responseBody = utf8.decode(rawBytes, allowMalformed: true);

      debugPrint('[AuthService] Status: $statusCode');
      debugPrint('[AuthService] Headers: ${response.headers}');
      debugPrint('[AuthService] Body length: ${rawBytes.length}');
      debugPrint('[AuthService] Body: $responseBody');

      // Parse JSON body
      Map<String, dynamic>? json;
      try {
        final decoded = jsonDecode(responseBody);
        if (decoded is Map<String, dynamic>) json = decoded;
      } catch (_) {
        debugPrint('[AuthService] Body is not valid JSON');
      }

      if (statusCode < 200 || statusCode >= 300) {
        final msg = json != null ? _extractErrorMessage(json) : null;
        if (statusCode == 401 || statusCode == 403) {
          throw Exception(msg ?? 'Invalid email or password.');
        } else if (statusCode >= 500) {
          throw Exception('Server error ($statusCode). Please try again later.');
        } else {
          throw Exception(msg ?? 'Login failed (HTTP $statusCode).');
        }
      }

      final token = json != null ? _extractToken(json) : null;

      if (token == null || token.isEmpty) {
        throw Exception(
          'Token not found. Status: $statusCode. '
          'Headers: ${response.headers}. '
          'Body(${rawBytes.length}b): $responseBody',
        );
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, token);
      await prefs.setString(AppConstants.userEmailKey, email);

      debugPrint('[AuthService] Login successful. Token stored.');
      return token;
    } on DioException catch (e) {
      debugPrint('[AuthService] DioException: ${e.type} ${e.message}');
      throw Exception('Connection error: ${e.message}');
    } catch (e) {
      debugPrint('[AuthService] Unexpected error: $e');
      if (e is Exception) rethrow;
      throw Exception('An unexpected error occurred: $e');
    }
  }

  /// Extracts token from any common response shape the backend might return.
  /// Also handles raw JSON strings (when Dio doesn't auto-parse due to
  /// missing/wrong Content-Type header on the server response).
  String? _extractToken(dynamic responseData) {
    if (responseData == null) return null;

    // If Dio returned a raw String instead of a parsed Map, try to decode it
    if (responseData is String) {
      if (responseData.isEmpty) return null;
      try {
        final decoded = jsonDecode(responseData);
        return _extractToken(decoded);
      } catch (_) {
        return null;
      }
    }

    if (responseData is Map<String, dynamic>) {
      // Direct token fields
      for (final key in [
        'token',
        'access_token',
        'accessToken',
        'jwt',
        'auth_token',
        'authToken',
        'id_token',
        'idToken',
      ]) {
        if (responseData[key] is String) {
          return responseData[key] as String;
        }
      }

      // Nested inside 'data', 'result', 'auth', 'user'
      for (final wrapper in ['data', 'result', 'auth', 'user', 'payload']) {
        if (responseData[wrapper] is Map<String, dynamic>) {
          final nested = responseData[wrapper] as Map<String, dynamic>;
          for (final key in [
            'token',
            'access_token',
            'accessToken',
            'jwt',
            'auth_token',
            'authToken',
          ]) {
            if (nested[key] is String) {
              return nested[key] as String;
            }
          }
        }
      }
    }

    return null;
  }

  /// Extracts human-readable error message from backend error responses.
  String? _extractErrorMessage(dynamic data) {
    if (data == null) return null;
    if (data is String) {
      // Try to decode JSON string first
      try {
        final decoded = jsonDecode(data);
        return _extractErrorMessage(decoded);
      } catch (_) {
        return data.isNotEmpty ? data : null;
      }
    }
    if (data is Map<String, dynamic>) {
      for (final key in [
        'message',
        'error',
        'msg',
        'detail',
        'description',
        'errorMessage',
      ]) {
        if (data[key] is String && (data[key] as String).isNotEmpty) {
          return data[key] as String;
        }
      }
    }
    return null;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userEmailKey);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.tokenKey);
  }

  Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.userEmailKey);
  }

  Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
