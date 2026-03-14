import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/warehouse.dart';
import '../models/location.dart';
import '../providers/warehouse_provider.dart';
import '../providers/product_provider.dart';
import '../utils/app_theme.dart';

class LocationScreen extends StatefulWidget {
  final Warehouse warehouse;

  const LocationScreen({super.key, required this.warehouse});

  @override
  State<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends State<LocationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context
          .read<WarehouseProvider>()
          .fetchLocations(warehouseId: widget.warehouse.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.warehouse.name),
            const Text('Locations',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.normal,
                    color: Colors.white70)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context
                .read<WarehouseProvider>()
                .fetchLocations(warehouseId: widget.warehouse.id),
          ),
        ],
      ),
      body: Column(
        children: [
          // Warehouse meta bar
          Container(
            color: AppTheme.primary,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(children: [
              if (widget.warehouse.shortCode != null) ...[
                const Icon(Icons.tag, color: Colors.white60, size: 13),
                const SizedBox(width: 4),
                Text(widget.warehouse.shortCode!,
                    style: const TextStyle(
                        color: Colors.white70, fontSize: 13)),
                const SizedBox(width: 12),
              ],
              if (widget.warehouse.address != null)
                Expanded(
                  child: Row(children: [
                    const Icon(Icons.location_on_outlined,
                        color: Colors.white60, size: 13),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(widget.warehouse.address!,
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 13),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ]),
                ),
            ]),
          ),
          Expanded(
            child: Consumer<WarehouseProvider>(
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
                            provider.errorMessage ??
                                'Failed to load locations.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => provider.fetchLocations(
                                warehouseId: widget.warehouse.id),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                final locations = provider.locations;
                if (locations.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_off_outlined,
                            size: 64, color: AppTheme.textSecondary),
                        SizedBox(height: 12),
                        Text('No locations found',
                            style: TextStyle(
                                color: AppTheme.textSecondary)),
                      ],
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => provider.fetchLocations(
                      warehouseId: widget.warehouse.id),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: locations.length,
                    itemBuilder: (_, i) =>
                        _LocationTile(location: locations[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationTile extends StatelessWidget {
  final Location location;

  const _LocationTile({required this.location});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.grid_view_outlined,
                color: AppTheme.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  location.name,
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary),
                ),
                if (location.warehouseName != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    location.warehouseName!,
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ],
              ],
            ),
          ),
          if (location.shortCode != null)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.accent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                location.shortCode!,
                style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.accent,
                    fontWeight: FontWeight.w500),
              ),
            ),
        ]),
      ),
    );
  }
}
