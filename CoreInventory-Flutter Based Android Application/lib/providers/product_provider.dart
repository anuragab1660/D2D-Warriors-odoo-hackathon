import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../services/product_service.dart';

enum LoadingState { idle, loading, success, error }

class ProductProvider extends ChangeNotifier {
  final ProductService _service = ProductService();

  LoadingState _state = LoadingState.idle;
  List<Product> _products = [];
  List<Product> _filtered = [];
  String? _errorMessage;
  String _searchQuery = '';
  Product? _selectedProduct;

  LoadingState get state => _state;
  List<Product> get products => _filtered;
  String? get errorMessage => _errorMessage;
  Product? get selectedProduct => _selectedProduct;

  Future<void> fetchProducts() async {
    _state = LoadingState.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      _products = await _service.getProducts();
      _applyFilter();
      _state = LoadingState.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _state = LoadingState.error;
    }
    notifyListeners();
  }

  void search(String query) {
    _searchQuery = query;
    _applyFilter();
    notifyListeners();
  }

  void _applyFilter() {
    if (_searchQuery.isEmpty) {
      _filtered = List.from(_products);
    } else {
      final q = _searchQuery.toLowerCase();
      _filtered = _products.where((p) {
        return p.name.toLowerCase().contains(q) ||
            p.sku.toLowerCase().contains(q) ||
            p.category.toLowerCase().contains(q);
      }).toList();
    }
  }

  Future<Product?> getProductBySku(String sku) async {
    try {
      return await _service.getProductBySku(sku);
    } catch (_) {
      return null;
    }
  }

  Future<void> selectProduct(int id) async {
    _state = LoadingState.loading;
    notifyListeners();
    try {
      _selectedProduct = await _service.getProductById(id);
      _state = LoadingState.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _state = LoadingState.error;
    }
    notifyListeners();
  }

  void setSelectedProduct(Product product) {
    _selectedProduct = product;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
