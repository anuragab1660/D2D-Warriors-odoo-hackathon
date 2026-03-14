class AppConstants {
  // Docker-compose exposes the server on host port 5001 (maps container:5000 → host:5001)
  // Android emulator reaches host machine via 10.0.2.2
  static const String baseUrl = 'https://coreinventory-8vf7.onrender.com/api';
  static const String tokenKey = 'auth_token';
  static const String userEmailKey = 'user_email';
  static const String pendingMovementsBox = 'pending_movements';
  static const String productsBox = 'products_cache';
}
