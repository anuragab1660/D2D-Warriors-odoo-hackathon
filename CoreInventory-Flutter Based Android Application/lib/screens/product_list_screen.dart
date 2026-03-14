import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/category.dart';
import '../providers/product_provider.dart';
import '../models/product.dart';
import '../services/category_service.dart';
import '../utils/app_theme.dart';
import '../widgets/home_drawer_opener.dart';
import 'add_product_screen.dart';
import 'barcode_scanner_screen.dart';
import 'product_detail_screen.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final _searchController = TextEditingController();
  final CategoryService _categoryService = CategoryService();

  List<Category> _categories = [];
  int? _selectedCategoryId; // null = All

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
    });
    _fetchCategories();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchCategories() async {
    try {
      final cats = await _categoryService.getCategories();
      if (mounted) setState(() => _categories = cats);
    } catch (_) {
      // silently ignore — categories filter just won't show
    }
  }

  List<Product> _applyFilter(List<Product> products) {
    if (_selectedCategoryId == null) return products;
    return products
        .where((p) => p.categoryId == _selectedCategoryId)
        .toList();
  }

  void _openScanner() async {
    final sku = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const BarcodeScannerScreen()),
    );
    if (sku != null && mounted) {
      final product =
          await context.read<ProductProvider>().getProductBySku(sku);
      if (product != null && mounted) {
        context.read<ProductProvider>().setSelectedProduct(product);
        Navigator.of(context).push(
          MaterialPageRoute(
              builder: (_) => ProductDetailScreen(product: product)),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No product found for SKU: $sku'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  Future<void> _openAddProduct() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const AddProductScreen()),
    );
    if (result == true && mounted) {
      context.read<ProductProvider>().fetchProducts();
    }
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
        title: const Text('Products'),
        backgroundColor: AppTheme.surface,
        actions: [
          TextButton.icon(
            onPressed: _openAddProduct,
            icon: const Icon(Icons.add, size: 18, color: AppTheme.accent),
            label: const Text(
              '+ New',
              style: TextStyle(
                color: AppTheme.accent,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Scan Barcode',
            onPressed: _openScanner,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<ProductProvider>().fetchProducts(),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search bar ─────────────────────────────────────────────────────
          Container(
            color: AppTheme.surface,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => context.read<ProductProvider>().search(v),
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search products, SKU, category...',
                hintStyle:
                    const TextStyle(color: AppTheme.textSecondary),
                prefixIcon: const Icon(Icons.search,
                    color: AppTheme.textSecondary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear,
                            color: AppTheme.textSecondary),
                        onPressed: () {
                          _searchController.clear();
                          context.read<ProductProvider>().search('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.surfaceVariant,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide:
                      const BorderSide(color: AppTheme.accent, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
              ),
            ),
          ),

          // ── Category filter chips ──────────────────────────────────────────
          if (_categories.isNotEmpty)
            Container(
              color: AppTheme.surface,
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  // "All" chip
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: FilterChip(
                      label: const Text('All'),
                      selected: _selectedCategoryId == null,
                      onSelected: (_) =>
                          setState(() => _selectedCategoryId = null),
                      selectedColor: AppTheme.accent.withOpacity(0.2),
                      checkmarkColor: AppTheme.accent,
                      labelStyle: TextStyle(
                        color: _selectedCategoryId == null
                            ? AppTheme.accent
                            : AppTheme.textSecondary,
                        fontWeight: _selectedCategoryId == null
                            ? FontWeight.w600
                            : FontWeight.normal,
                        fontSize: 13,
                      ),
                      side: BorderSide(
                        color: _selectedCategoryId == null
                            ? AppTheme.accent
                            : AppTheme.border,
                      ),
                      backgroundColor: AppTheme.surfaceVariant,
                    ),
                  ),
                  // Category chips
                  ..._categories.map((cat) => Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          label: Text(cat.name),
                          selected: _selectedCategoryId == cat.id,
                          onSelected: (_) => setState(() =>
                              _selectedCategoryId = _selectedCategoryId == cat.id
                                  ? null
                                  : cat.id),
                          selectedColor: AppTheme.accent.withOpacity(0.2),
                          checkmarkColor: AppTheme.accent,
                          labelStyle: TextStyle(
                            color: _selectedCategoryId == cat.id
                                ? AppTheme.accent
                                : AppTheme.textSecondary,
                            fontWeight: _selectedCategoryId == cat.id
                                ? FontWeight.w600
                                : FontWeight.normal,
                            fontSize: 13,
                          ),
                          side: BorderSide(
                            color: _selectedCategoryId == cat.id
                                ? AppTheme.accent
                                : AppTheme.border,
                          ),
                          backgroundColor: AppTheme.surfaceVariant,
                        ),
                      )),
                ],
              ),
            ),

          // ── Table header ───────────────────────────────────────────────────
          Container(
            color: AppTheme.surfaceVariant,
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: const Row(
              children: [
                SizedBox(
                  width: 32,
                  child: Text('#',
                      style: _headerStyle),
                ),
                Expanded(
                  flex: 4,
                  child: Text('PRODUCT', style: _headerStyle),
                ),
                SizedBox(
                  width: 60,
                  child: Text('COST', style: _headerStyle,
                      textAlign: TextAlign.right),
                ),
                SizedBox(
                  width: 52,
                  child: Text('ON HAND',
                      style: _headerStyle, textAlign: TextAlign.right),
                ),
                SizedBox(
                  width: 46,
                  child: Text('FREE', style: _headerStyle,
                      textAlign: TextAlign.right),
                ),
                SizedBox(
                  width: 52,
                  child: Text('STATUS', style: _headerStyle,
                      textAlign: TextAlign.center),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // ── Product list ───────────────────────────────────────────────────
          Expanded(
            child: Consumer<ProductProvider>(
              builder: (_, provider, __) {
                if (provider.state == LoadingState.loading &&
                    provider.products.isEmpty) {
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
                              size: 48,
                              color: AppTheme.textSecondary),
                          const SizedBox(height: 12),
                          Text(
                            provider.errorMessage ??
                                'Failed to load products.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: provider.fetchProducts,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                final filtered = _applyFilter(provider.products);
                if (filtered.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.inventory_2_outlined,
                            size: 64,
                            color: AppTheme.textSecondary),
                        SizedBox(height: 12),
                        Text('No products found',
                            style: TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 16)),
                      ],
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: provider.fetchProducts,
                  color: AppTheme.accent,
                  backgroundColor: AppTheme.surface,
                  child: ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final product = filtered[i];
                      return _ProductRow(
                        index: i + 1,
                        product: product,
                        onTap: () {
                          provider.setSelectedProduct(product);
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  ProductDetailScreen(product: product),
                            ),
                          );
                        },
                      );
                    },
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

// ── Table header text style ───────────────────────────────────────────────────
const _headerStyle = TextStyle(
  fontSize: 10,
  fontWeight: FontWeight.w700,
  color: AppTheme.textSecondary,
  letterSpacing: 0.5,
);

// ── Product row ───────────────────────────────────────────────────────────────
class _ProductRow extends StatelessWidget {
  final int index;
  final Product product;
  final VoidCallback onTap;

  const _ProductRow({
    required this.index,
    required this.product,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isEven = index % 2 == 0;
    final isLow = product.isLowStock;

    return Material(
      color: isEven ? AppTheme.background : AppTheme.surfaceVariant,
      child: InkWell(
        onTap: onTap,
        highlightColor: AppTheme.accent.withOpacity(0.06),
        splashColor: AppTheme.accent.withOpacity(0.08),
        child: Column(
          children: [
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Index
                  SizedBox(
                    width: 32,
                    child: Text(
                      '$index',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),

                  // Name + SKU
                  Expanded(
                    flex: 4,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          product.sku,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.textSecondary,
                            fontFamily: 'monospace',
                          ),
                        ),
                        if (product.category.isNotEmpty &&
                            product.category != 'Uncategorized')
                          Text(
                            product.category,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),

                  // Cost
                  SizedBox(
                    width: 60,
                    child: Text(
                      product.cost > 0
                          ? product.cost.toStringAsFixed(2)
                          : '—',
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),

                  // On Hand
                  SizedBox(
                    width: 52,
                    child: Text(
                      product.onHand.toStringAsFixed(0),
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isLow ? AppTheme.error : AppTheme.textPrimary,
                      ),
                    ),
                  ),

                  // Free to use
                  SizedBox(
                    width: 46,
                    child: Text(
                      product.freeToUse.toStringAsFixed(0),
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),

                  // Status chip
                  SizedBox(
                    width: 52,
                    child: Center(
                      child: _StatusChip(isLow: isLow),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.border),
          ],
        ),
      ),
    );
  }
}

// ── Status chip ───────────────────────────────────────────────────────────────
class _StatusChip extends StatelessWidget {
  final bool isLow;
  const _StatusChip({required this.isLow});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
        decoration: BoxDecoration(
          color: isLow
              ? AppTheme.error.withOpacity(0.15)
              : AppTheme.accent.withOpacity(0.15),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          isLow ? 'Low' : 'OK',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: isLow ? AppTheme.error : AppTheme.accent,
          ),
        ),
      );
}
