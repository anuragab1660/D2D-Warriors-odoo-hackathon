import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/movement_provider.dart';
import '../utils/app_theme.dart';
import '../models/movement.dart';
import '../widgets/home_drawer_opener.dart';
import 'barcode_scanner_screen.dart';
import 'categories_screen.dart';
import 'dashboard_screen.dart';
import 'history_screen.dart';
import 'movement_screen.dart';
import 'product_list_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import 'warehouse_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = const [
    DashboardScreen(),
    ProductListScreen(),
    WarehouseScreen(),
    HistoryScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MovementProvider>().init();
    });
  }

  String _getInitials(String? email) {
    if (email == null || email.isEmpty) return 'U';
    return email[0].toUpperCase();
  }

  void _navigateToMovement(MovementType type) {
    Navigator.of(context).pop(); // close drawer
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MovementScreen(
          preSelectedType: type,
        ),
      ),
    );
  }

  void _navigateTo(Widget screen) {
    Navigator.of(context).pop(); // close drawer
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  void _switchTab(int index) {
    Navigator.of(context).pop(); // close drawer
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final email = context.watch<AuthProvider>().userEmail ?? '';
    final initials = _getInitials(email);
    final displayName = email.isNotEmpty
        ? (email.split('@').first)
            .replaceAll(RegExp(r'[._-]'), ' ')
            .split(' ')
            .map((w) =>
                w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : '')
            .join(' ')
        : 'User';

    return Scaffold(
      key: _scaffoldKey,
      drawer: _buildDrawer(context, initials, displayName, email),
      body: HomeDrawerOpener(
        openDrawer: () => _scaffoldKey.currentState?.openDrawer(),
        child: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => const BarcodeScannerScreen(quickUpdate: true),
        )),
        backgroundColor: AppTheme.accent,
        tooltip: 'Scan to Update Stock',
        child: const Icon(Icons.qr_code_scanner, color: Colors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: Consumer<MovementProvider>(
        builder: (_, movProv, __) => BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.inventory_2_outlined),
              activeIcon: Icon(Icons.inventory_2),
              label: 'Products',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.warehouse_outlined),
              activeIcon: Icon(Icons.warehouse),
              label: 'Warehouses',
            ),
            BottomNavigationBarItem(
              icon: Badge(
                isLabelVisible: movProv.pendingCount > 0,
                label: Text('${movProv.pendingCount}'),
                child: const Icon(Icons.history_outlined),
              ),
              activeIcon: Badge(
                isLabelVisible: movProv.pendingCount > 0,
                label: Text('${movProv.pendingCount}'),
                child: const Icon(Icons.history),
              ),
              label: 'History',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(
      BuildContext context, String initials, String displayName, String email) {
    return Drawer(
      backgroundColor: AppTheme.surface,
      child: Column(
        children: [
          // ── Drawer Header ────────────────────────────────────────────────
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 20,
              bottom: 24,
              left: 20,
              right: 20,
            ),
            decoration: const BoxDecoration(
              color: AppTheme.primary,
              border: Border(
                  bottom: BorderSide(color: AppTheme.border)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo row
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.inventory_2,
                          color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CoreInventory',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.3,
                          ),
                        ),
                        Text(
                          'Warehouse Management',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Nav items ────────────────────────────────────────────────────
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                // Dashboard
                _DrawerItem(
                  icon: Icons.dashboard_outlined,
                  label: 'Dashboard',
                  onTap: () => _switchTab(0),
                ),

                // ── PRODUCTS ──
                _DrawerSectionLabel('PRODUCTS'),
                _DrawerItem(
                  icon: Icons.inventory_2_outlined,
                  label: 'Products',
                  onTap: () => _switchTab(1),
                ),
                _DrawerItem(
                  icon: Icons.label_outline,
                  label: 'Categories',
                  onTap: () => _navigateTo(const CategoriesScreen()),
                ),

                // ── OPERATIONS ──
                _DrawerSectionLabel('OPERATIONS'),
                _DrawerItem(
                  icon: Icons.move_to_inbox_outlined,
                  label: 'Receipts',
                  onTap: () => _navigateToMovement(MovementType.receipt),
                ),
                _DrawerItem(
                  icon: Icons.local_shipping_outlined,
                  label: 'Deliveries',
                  onTap: () => _navigateToMovement(MovementType.delivery),
                ),
                _DrawerItem(
                  icon: Icons.swap_horiz,
                  label: 'Transfers',
                  onTap: () => _navigateToMovement(MovementType.transfer),
                ),
                _DrawerItem(
                  icon: Icons.tune,
                  label: 'Adjustments',
                  onTap: () => _navigateToMovement(MovementType.adjustment),
                ),
                _DrawerItem(
                  icon: Icons.history,
                  label: 'Move History',
                  onTap: () => _switchTab(3),
                ),

                // ── CONFIGURATION ──
                _DrawerSectionLabel('CONFIGURATION'),
                _DrawerItem(
                  icon: Icons.settings_outlined,
                  label: 'Settings',
                  onTap: () => _navigateTo(const SettingsScreen()),
                ),
              ],
            ),
          ),

          // ── Drawer bottom: user + actions ────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              border:
                  Border(top: BorderSide(color: AppTheme.border)),
              color: AppTheme.primary,
            ),
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 14,
              bottom: MediaQuery.of(context).padding.bottom + 14,
            ),
            child: Column(
              children: [
                // User info row
                Row(
                  children: [
                    // Avatar
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.accent,
                      child: Text(
                        initials,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(
                            displayName,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            email,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Buttons row
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.textPrimary,
                          side: const BorderSide(
                              color: AppTheme.border),
                          padding: const EdgeInsets.symmetric(
                              vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(8)),
                        ),
                        onPressed: () {
                          Navigator.of(context).pop();
                          Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) =>
                                    const ProfileScreen()),
                          );
                        },
                        icon: const Icon(Icons.person_outline,
                            size: 16),
                        label: const Text('My Profile',
                            style: TextStyle(fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.error,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(8)),
                        ),
                        onPressed: () async {
                          Navigator.of(context).pop();
                          await context
                              .read<AuthProvider>()
                              .logout();
                        },
                        icon: const Icon(Icons.logout, size: 16),
                        label: const Text('Logout',
                            style: TextStyle(fontSize: 13)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Drawer item ───────────────────────────────────────────────────────────────
class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          highlightColor: AppTheme.accent.withOpacity(0.08),
          splashColor: AppTheme.accent.withOpacity(0.12),
          child: Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 11),
            child: Row(
              children: [
                Icon(icon, size: 20, color: AppTheme.textSecondary),
                const SizedBox(width: 14),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

// ── Drawer section label ──────────────────────────────────────────────────────
class _DrawerSectionLabel extends StatelessWidget {
  final String text;
  const _DrawerSectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppTheme.textSecondary,
            letterSpacing: 1.0,
          ),
        ),
      );
}
