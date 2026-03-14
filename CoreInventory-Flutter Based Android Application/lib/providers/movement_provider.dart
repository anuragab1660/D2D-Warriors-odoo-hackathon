import 'package:flutter/foundation.dart';
import '../models/movement.dart';
import '../services/movement_service.dart';
import '../services/offline_sync_service.dart';
import 'product_provider.dart';

class MovementProvider extends ChangeNotifier {
  final MovementService _movementService = MovementService();
  final OfflineSyncService _offlineService = OfflineSyncService();

  LoadingState _state = LoadingState.idle;
  List<Movement> _history = [];
  String? _errorMessage;
  String? _successMessage;
  int _pendingCount = 0;
  Map<String, dynamic>? _lastCreatedResponse;

  LoadingState get state => _state;
  List<Movement> get history => _history;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  int get pendingCount => _pendingCount;
  Map<String, dynamic>? get lastCreatedResponse => _lastCreatedResponse;

  Future<void> init() async {
    await _offlineService.init();
    _pendingCount = _offlineService.pendingCount;
    notifyListeners();
  }

  Future<bool> createDocument(MovementDocument doc) async {
    _state = LoadingState.loading;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    final isOnline = await _offlineService.isOnline();
    if (isOnline) {
      try {
        _lastCreatedResponse = await _movementService.createDocument(doc);
        _successMessage = '${doc.type.label} created successfully.';
        _state = LoadingState.success;
        notifyListeners();
        return true;
      } catch (e) {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _state = LoadingState.error;
        notifyListeners();
        return false;
      }
    } else {
      final pending = PendingMovement(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        payload: doc.toPayload(),
        endpoint: doc.type.apiEndpoint,
        createdAt: DateTime.now(),
      );
      await _offlineService.storePending(pending);
      _pendingCount = _offlineService.pendingCount;
      _successMessage =
          'No internet. ${doc.type.label} saved offline and will sync when connected.';
      _state = LoadingState.success;
      notifyListeners();
      return true;
    }
  }

  Future<void> fetchHistory({String? type, int? productId}) async {
    _state = LoadingState.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      _history = await _movementService.getMovementHistory(
        type: type,
        productId: productId,
      );
      _state = LoadingState.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _state = LoadingState.error;
    }
    notifyListeners();
  }

  Future<void> syncPending() async {
    await _offlineService.syncPending();
    _pendingCount = _offlineService.pendingCount;
    notifyListeners();
  }

  void clearMessages() {
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }
}
