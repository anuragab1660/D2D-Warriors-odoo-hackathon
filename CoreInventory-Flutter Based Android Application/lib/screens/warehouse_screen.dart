import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/warehouse_provider.dart';
import '../providers/product_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/home_drawer_opener.dart';
import '../widgets/warehouse_card.dart';
import 'location_screen.dart';

class WarehouseScreen extends StatefulWidget {
  const WarehouseScreen({super.key});

  @override
  State<WarehouseScreen> createState() => _WarehouseScreenState();
}

class _WarehouseScreenState extends State<WarehouseScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WarehouseProvider>().fetchWarehouses();
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
        title: const Text('Warehouses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                context.read<WarehouseProvider>().fetchWarehouses(),
          ),
        ],
      ),
      body: Consumer<WarehouseProvider>(
        builder: (_, provider, __) {
          if (provider.state == LoadingState.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.state == LoadingState.error) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 48, color: AppTheme.textSecondary),
                    const SizedBox(height: 12),
                    Text(
                      provider.errorMessage ?? 'Failed to load warehouses.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: provider.fetchWarehouses,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          final warehouses = provider.warehouses;
          if (warehouses.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.warehouse_outlined,
                      size: 64, color: AppTheme.textSecondary),
                  SizedBox(height: 12),
                  Text('No warehouses found',
                      style: TextStyle(color: AppTheme.textSecondary)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: provider.fetchWarehouses,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: warehouses.length,
              itemBuilder: (_, i) {
                final warehouse = warehouses[i];
                return WarehouseCard(
                  warehouse: warehouse,
                  onTap: () {
                    provider.selectWarehouse(warehouse);
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) =>
                            LocationScreen(warehouse: warehouse),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
