import 'package:flutter/foundation.dart';
import '../models/dashboard_stats.dart';
import '../services/dashboard_service.dart';
import 'product_provider.dart';

class DashboardProvider extends ChangeNotifier {
  final DashboardService _service = DashboardService();

  LoadingState _state = LoadingState.idle;
  DashboardStats _stats = DashboardStats.empty();
  String? _errorMessage;

  LoadingState get state => _state;
  DashboardStats get stats => _stats;
  String? get errorMessage => _errorMessage;

  Future<void> fetchStats() async {
    _state = LoadingState.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      _stats = await _service.getDashboardStats();
      _state = LoadingState.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _state = LoadingState.error;
    }
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
