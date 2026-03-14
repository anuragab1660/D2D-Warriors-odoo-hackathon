import 'package:flutter/foundation.dart';
import '../models/warehouse.dart';
import '../models/location.dart';
import '../services/warehouse_service.dart';
import 'product_provider.dart';

class WarehouseProvider extends ChangeNotifier {
  final WarehouseService _service = WarehouseService();

  LoadingState _state = LoadingState.idle;
  List<Warehouse> _warehouses = [];
  List<Location> _locations = [];
  String? _errorMessage;
  Warehouse? _selectedWarehouse;

  LoadingState get state => _state;
  List<Warehouse> get warehouses => _warehouses;
  List<Location> get locations => _locations;
  String? get errorMessage => _errorMessage;
  Warehouse? get selectedWarehouse => _selectedWarehouse;

  Future<void> fetchWarehouses() async {
    _state = LoadingState.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      _warehouses = await _service.getWarehouses();
      _state = LoadingState.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _state = LoadingState.error;
    }
    notifyListeners();
  }

  Future<void> fetchLocations({int? warehouseId}) async {
    _state = LoadingState.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      _locations = await _service.getLocations(warehouseId: warehouseId);
      _state = LoadingState.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _state = LoadingState.error;
    }
    notifyListeners();
  }

  void selectWarehouse(Warehouse warehouse) {
    _selectedWarehouse = warehouse;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
