import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/product_provider.dart';
import '../models/dashboard_stats.dart';
import '../utils/app_theme.dart';
import '../widgets/home_drawer_opener.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => HomeDrawerOpener.open(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dashboard'),
            Text('Warehouse Overview',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.normal,
                    color: Colors.white70)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<DashboardProvider>().fetchStats(),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.person_outline),
            onSelected: (value) async {
              if (value == 'logout') {
                await context.read<AuthProvider>().logout();
                if (mounted) {
                  Navigator.of(context).pushReplacementNamed('/login');
                }
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'email',
                enabled: false,
                child: Consumer<AuthProvider>(
                  builder: (_, auth, __) => Text(
                    auth.userEmail ?? '',
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'logout',
                child: Row(children: [
                  Icon(Icons.logout, size: 18),
                  SizedBox(width: 8),
                  Text('Sign Out'),
                ]),
              ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<DashboardProvider>(
        builder: (_, provider, __) {
          if (provider.state == LoadingState.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.state == LoadingState.error) {
            return _ErrorView(
              message: provider.errorMessage ?? 'Failed to load dashboard.',
              onRetry: provider.fetchStats,
            );
          }
          return RefreshIndicator(
            onRefresh: provider.fetchStats,
            child: _DashboardBody(stats: provider.stats),
          );
        },
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  final DashboardStats stats;
  const _DashboardBody({required this.stats});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        // ── Top stat grid ─────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.45,
            children: [
              _StatCard(
                title: 'Total Products',
                value: '${stats.totalProducts}',
                icon: Icons.inventory_2_outlined,
                color: AppTheme.info,
              ),
              _StatCard(
                title: 'Low Stock',
                value: '${stats.lowStockCount}',
                icon: Icons.warning_amber_outlined,
                color: AppTheme.warning,
              ),
              _StatCard(
                title: 'Pending Receipts',
                value: '${stats.pendingReceipts}',
                icon: Icons.move_to_inbox_outlined,
                color: AppTheme.accent,
              ),
              _StatCard(
                title: 'Pending Deliveries',
                value: '${stats.pendingDeliveries}',
                icon: Icons.local_shipping_outlined,
                color: AppTheme.error,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── Transfers pending ─────────────────────────────────────────
        if (stats.pendingTransfers > 0)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Card(
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFF8B5CF6),
                  child: Icon(Icons.swap_horiz, color: Colors.white, size: 20),
                ),
                title: const Text('Pending Transfers'),
                trailing: Text(
                  '${stats.pendingTransfers}',
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF8B5CF6)),
                ),
              ),
            ),
          ),
        const SizedBox(height: 16),

        // ── Receipt breakdown ──────────────────────────────────────────
        _BreakdownCard(
          title: 'Receipt Pipeline',
          icon: Icons.move_to_inbox_outlined,
          color: AppTheme.accent,
          breakdown: stats.receiptBreakdown,
          processLabel: 'To Receive',
        ),
        const SizedBox(height: 12),

        // ── Delivery breakdown ─────────────────────────────────────────
        _BreakdownCard(
          title: 'Delivery Pipeline',
          icon: Icons.local_shipping_outlined,
          color: AppTheme.error,
          breakdown: stats.deliveryBreakdown,
          processLabel: 'To Deliver',
        ),
        const SizedBox(height: 20),

        // ── Low stock products ─────────────────────────────────────────
        if (stats.lowStockProducts.isNotEmpty) ...[
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text('Low Stock Alert',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary)),
          ),
          const SizedBox(height: 8),
          ...stats.lowStockProducts.map((p) => Card(
                margin:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0x1AEF4444),
                    child: Icon(Icons.warning_amber,
                        color: AppTheme.error, size: 18),
                  ),
                  title: Text(p.name,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text(p.sku,
                      style: const TextStyle(fontSize: 12)),
                  trailing: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${p.onHand.toStringAsFixed(0)} on hand',
                          style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.error,
                              fontWeight: FontWeight.bold)),
                      Text('min ${p.reorderQty}',
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 20),
        ],

        // ── Today's activity ───────────────────────────────────────────
        if (stats.todayReceipts.isNotEmpty ||
            stats.todayDeliveries.isNotEmpty) ...[
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              "Today's Activity",
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary),
            ),
          ),
          const SizedBox(height: 8),
          ...stats.todayReceipts.map((d) => _TodayDocTile(
                doc: d,
                type: 'Receipt',
                color: AppTheme.accent,
                icon: Icons.move_to_inbox_outlined,
              )),
          ...stats.todayDeliveries.map((d) => _TodayDocTile(
                doc: d,
                type: 'Delivery',
                color: AppTheme.error,
                icon: Icons.local_shipping_outlined,
              )),
          const SizedBox(height: 16),
        ],
      ],
    );
  }
}

// ── Reusable sub-widgets ──────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard(
      {required this.title,
      required this.value,
      required this.icon,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary)),
                Text(title,
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final DocBreakdown breakdown;
  final String processLabel;

  const _BreakdownCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.breakdown,
    required this.processLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary)),
            ]),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _BreakdownStat(label: 'Late', value: breakdown.late,
                    color: AppTheme.error),
                _BreakdownStat(label: 'Waiting', value: breakdown.waiting,
                    color: AppTheme.warning),
                _BreakdownStat(label: 'Planned', value: breakdown.operations,
                    color: AppTheme.info),
                _BreakdownStat(label: processLabel, value: breakdown.toProcess,
                    color: color),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BreakdownStat extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _BreakdownStat(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$value',
            style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color)),
        Text(label,
            style:
                const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
      ],
    );
  }
}

class _TodayDocTile extends StatelessWidget {
  final TodayDoc doc;
  final String type;
  final Color color;
  final IconData icon;

  const _TodayDocTile(
      {required this.doc,
      required this.type,
      required this.color,
      required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 3),
      child: ListTile(
        dense: true,
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.1),
          child: Icon(icon, color: color, size: 18),
        ),
        title: Text(doc.ref,
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600)),
        subtitle: doc.party != null
            ? Text(doc.party!,
                style: const TextStyle(fontSize: 12))
            : null,
        trailing: _StatusChip(status: doc.status, color: color),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  final Color color;

  const _StatusChip({required this.status, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style:
            TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off,
                size: 64, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textSecondary)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
