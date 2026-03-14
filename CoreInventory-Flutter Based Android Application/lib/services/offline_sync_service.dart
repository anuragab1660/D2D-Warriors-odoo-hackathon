import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/movement.dart';
import '../utils/constants.dart';
import 'movement_service.dart';

class OfflineSyncService {
  final MovementService _movementService = MovementService();
  late Box<String> _box;
  bool _isSyncing = false;

  Future<void> init() async {
    _box = await Hive.openBox<String>(AppConstants.pendingMovementsBox);
    Connectivity().onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) syncPending();
    });
  }

  Future<void> storePending(PendingMovement pending) async {
    await _box.put(pending.id, jsonEncode(pending.toJson()));
  }

  List<PendingMovement> getPending() => _box.values
      .map((v) =>
          PendingMovement.fromJson(jsonDecode(v) as Map<String, dynamic>))
      .toList();

  int get pendingCount => _box.length;

  Future<void> syncPending() async {
    if (_isSyncing || _box.isEmpty) return;
    _isSyncing = true;
    try {
      for (final item in getPending()) {
        try {
          await _movementService.createMovementRaw(item.endpoint, item.payload);
          await _box.delete(item.id);
        } catch (_) {
          // Skip — retry on next sync
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<bool> isOnline() async {
    final result = await Connectivity().checkConnectivity();
    return result != ConnectivityResult.none;
  }
}
