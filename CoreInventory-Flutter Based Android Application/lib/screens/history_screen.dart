import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/movement_provider.dart';
import '../providers/product_provider.dart';
import '../models/movement.dart';
import '../utils/app_theme.dart';
import '../widgets/home_drawer_opener.dart';
import '../widgets/movement_tile.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String? _selectedFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MovementProvider>().fetchHistory();
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
        title: const Text('Movement History'),
        actions: [
          Consumer<MovementProvider>(
            builder: (_, prov, __) {
              if (prov.pendingCount == 0) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () async {
                  await prov.syncPending();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Sync complete!'),
                        backgroundColor: AppTheme.accent,
                      ),
                    );
                    prov.fetchHistory();
                  }
                },
                icon: const Icon(Icons.sync, color: AppTheme.warning),
                label: Text(
                  '${prov.pendingCount} pending',
                  style: const TextStyle(color: AppTheme.warning),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                context.read<MovementProvider>().fetchHistory(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            color: AppTheme.primary,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(
                    label: 'All',
                    selected: _selectedFilter == null,
                    onSelected: () {
                      setState(() => _selectedFilter = null);
                      context.read<MovementProvider>().fetchHistory();
                    },
                  ),
                  const SizedBox(width: 8),
                  ...MovementType.values.map((type) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _FilterChip(
                          label: type.label,
                          selected: _selectedFilter == type.label.toLowerCase(),
                          onSelected: () {
                            setState(() =>
                                _selectedFilter = type.label.toLowerCase());
                            context.read<MovementProvider>().fetchHistory(
                                type: type.label.toLowerCase());
                          },
                        ),
                      )),
                ],
              ),
            ),
          ),
          // History List
          Expanded(
            child: Consumer<MovementProvider>(
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
                                'Failed to load history.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: provider.fetchHistory,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                final history = provider.history;
                if (history.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.history,
                            size: 64, color: AppTheme.textSecondary),
                        SizedBox(height: 12),
                        Text('No movement history',
                            style:
                                TextStyle(color: AppTheme.textSecondary)),
                        SizedBox(height: 6),
                        Text(
                          'Inventory movements will appear here',
                          style: TextStyle(
                              fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: provider.fetchHistory,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: history.length,
                    itemBuilder: (_, i) =>
                        MovementTile(movement: history[i]),
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

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSelected,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.accent : Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.white70,
            fontSize: 13,
            fontWeight:
                selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
