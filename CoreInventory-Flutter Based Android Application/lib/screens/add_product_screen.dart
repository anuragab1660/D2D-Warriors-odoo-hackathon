import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/category.dart';
import '../models/location.dart';
import '../services/category_service.dart';
import '../utils/app_theme.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _uomController = TextEditingController(text: 'pcs');
  final _costController = TextEditingController();
  final _reorderController = TextEditingController(text: '10');
  final _initialStockController = TextEditingController();

  final CategoryService _categoryService = CategoryService();
  final ApiClient _client = ApiClient();

  List<Category> _categories = [];
  List<Location> _locations = [];
  Category? _selectedCategory;
  Location? _selectedLocation;

  bool _loadingCategories = true;
  bool _loadingLocations = false;
  bool _submitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
    _fetchLocations();
    _initialStockController.addListener(_onInitialStockChanged);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _uomController.dispose();
    _costController.dispose();
    _reorderController.dispose();
    _initialStockController.dispose();
    super.dispose();
  }

  void _onInitialStockChanged() {
    setState(() {});
  }

  bool get _showLocationPicker {
    final v = double.tryParse(_initialStockController.text) ?? 0;
    return v > 0;
  }

  Future<void> _fetchCategories() async {
    setState(() => _loadingCategories = true);
    try {
      final cats = await _categoryService.getCategories();
      if (mounted) setState(() => _categories = cats);
    } catch (_) {
      // silently fail — category will just be empty
    } finally {
      if (mounted) setState(() => _loadingCategories = false);
    }
  }

  Future<void> _fetchLocations() async {
    setState(() => _loadingLocations = true);
    try {
      final response = await _client.get('/locations');
      final status = response.statusCode ?? 0;
      if (status >= 200 && status < 300) {
        final data = response.data;
        List<dynamic> list;
        if (data is List) {
          list = data;
        } else if (data is Map && data['data'] is List) {
          list = data['data'] as List;
        } else if (data is Map && data['locations'] is List) {
          list = data['locations'] as List;
        } else {
          list = [];
        }
        if (mounted) {
          setState(() => _locations = list
              .map((e) => Location.fromJson(e as Map<String, dynamic>))
              .toList());
        }
      }
    } catch (_) {
      // silently fail
    } finally {
      if (mounted) setState(() => _loadingLocations = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_showLocationPicker && _selectedLocation == null) {
      setState(() => _errorMessage = 'Please select a location for initial stock.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final body = <String, dynamic>{
        'name': _nameController.text.trim(),
        'sku': _skuController.text.trim().toUpperCase(),
        'uom': _uomController.text.trim().isEmpty
            ? 'pcs'
            : _uomController.text.trim(),
        if (_selectedCategory != null) 'category_id': _selectedCategory!.id,
        if (_costController.text.isNotEmpty)
          'per_unit_cost':
              double.tryParse(_costController.text.trim()) ?? 0.0,
        'reorder_qty':
            int.tryParse(_reorderController.text.trim()) ?? 10,
      };

      final initialStock =
          double.tryParse(_initialStockController.text.trim()) ?? 0.0;
      if (initialStock > 0 && _selectedLocation != null) {
        body['initial_stock'] = initialStock;
        body['initial_location_id'] = _selectedLocation!.id;
      }

      final response = await _client.post('/products', data: body);
      final status = response.statusCode ?? 0;

      if (status >= 200 && status < 300) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Product created successfully!'),
              backgroundColor: AppTheme.accent,
            ),
          );
          Navigator.of(context).pop(true);
        }
      } else {
        final data = response.data;
        String? msg;
        if (data is Map) {
          for (final key in ['message', 'error', 'msg', 'detail']) {
            if (data[key] is String && (data[key] as String).isNotEmpty) {
              msg = data[key] as String;
              break;
            }
          }
        }
        setState(
            () => _errorMessage = msg ?? 'Failed to create product (HTTP $status).');
      }
    } catch (e) {
      setState(() =>
          _errorMessage = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('New Product'),
        backgroundColor: AppTheme.surface,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Error banner ───────────────────────────────────────────────
            if (_errorMessage != null) ...[
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.error.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppTheme.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_errorMessage!,
                          style: const TextStyle(
                              color: AppTheme.error, fontSize: 13)),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _errorMessage = null),
                      child: const Icon(Icons.close,
                          color: AppTheme.error, size: 18),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ── Section: Basic Info ────────────────────────────────────────
            _sectionLabel('Basic Information'),
            const SizedBox(height: 12),

            // Name
            TextFormField(
              controller: _nameController,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Product Name *',
                hintText: 'e.g. Hydraulic Oil 5L',
                prefixIcon: Icon(Icons.inventory_2_outlined),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Name is required' : null,
            ),
            const SizedBox(height: 14),

            // SKU
            TextFormField(
              controller: _skuController,
              style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontFamily: 'monospace',
                  letterSpacing: 1.2),
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'SKU *',
                hintText: 'e.g. HYD-OIL-5L',
                prefixIcon: Icon(Icons.qr_code),
              ),
              onChanged: (v) {
                final upper = v.toUpperCase();
                if (upper != v) {
                  _skuController.value = _skuController.value.copyWith(
                    text: upper,
                    selection: TextSelection.collapsed(offset: upper.length),
                  );
                }
              },
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'SKU is required' : null,
            ),
            const SizedBox(height: 14),

            // Category dropdown
            _loadingCategories
                ? const _LoadingField(label: 'Category')
                : DropdownButtonFormField<Category>(
                    value: _selectedCategory,
                    dropdownColor: AppTheme.surface,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      prefixIcon: Icon(Icons.label_outline),
                    ),
                    hint: const Text('Select category',
                        style: TextStyle(color: AppTheme.textSecondary)),
                    items: _categories
                        .map((c) => DropdownMenuItem(
                              value: c,
                              child: Text(c.name),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => _selectedCategory = v),
                  ),
            const SizedBox(height: 14),

            // UOM
            TextFormField(
              controller: _uomController,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Unit of Measure',
                hintText: 'pcs, kg, L, m...',
                prefixIcon: Icon(Icons.straighten_outlined),
              ),
            ),
            const SizedBox(height: 24),

            // ── Section: Pricing & Thresholds ──────────────────────────────
            _sectionLabel('Pricing & Thresholds'),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _costController,
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true),
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Cost per Unit',
                      hintText: '0.00',
                      prefixIcon: Icon(Icons.attach_money_outlined),
                    ),
                    validator: (v) {
                      if (v != null && v.isNotEmpty) {
                        if (double.tryParse(v) == null) {
                          return 'Enter a valid number';
                        }
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _reorderController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Reorder Qty',
                      hintText: '10',
                      prefixIcon: Icon(Icons.warning_amber_outlined),
                    ),
                    validator: (v) {
                      if (v != null && v.isNotEmpty) {
                        if (int.tryParse(v) == null) {
                          return 'Enter a valid integer';
                        }
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ── Section: Initial Stock ─────────────────────────────────────
            _sectionLabel('Initial Stock (Optional)'),
            const SizedBox(height: 12),

            TextFormField(
              controller: _initialStockController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Initial Stock Quantity',
                hintText: '0 — leave blank to skip',
                prefixIcon: Icon(Icons.add_box_outlined),
              ),
              validator: (v) {
                if (v != null && v.isNotEmpty) {
                  if (double.tryParse(v) == null) return 'Enter a valid number';
                }
                return null;
              },
            ),

            if (_showLocationPicker) ...[
              const SizedBox(height: 14),
              _loadingLocations
                  ? const _LoadingField(label: 'Initial Location *')
                  : DropdownButtonFormField<Location>(
                      value: _selectedLocation,
                      dropdownColor: AppTheme.surface,
                      style: const TextStyle(color: AppTheme.textPrimary),
                      decoration: const InputDecoration(
                        labelText: 'Initial Location *',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                      hint: const Text('Select location',
                          style: TextStyle(color: AppTheme.textSecondary)),
                      isExpanded: true,
                      items: _locations
                          .map((l) => DropdownMenuItem(
                                value: l,
                                child: Text(l.displayName,
                                    overflow: TextOverflow.ellipsis),
                              ))
                          .toList(),
                      onChanged: (v) =>
                          setState(() => _selectedLocation = v),
                      validator: (v) => _showLocationPicker && v == null
                          ? 'Location is required when adding initial stock'
                          : null,
                    ),
            ],

            const SizedBox(height: 32),

            // ── Submit ─────────────────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline),
                label: Text(_submitting ? 'Creating...' : 'Create Product'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton(
                onPressed: _submitting
                    ? null
                    : () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppTheme.textSecondary,
          letterSpacing: 0.8,
        ),
      );
}

class _LoadingField extends StatelessWidget {
  final String label;
  const _LoadingField({required this.label});

  @override
  Widget build(BuildContext context) => InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.hourglass_empty_outlined),
        ),
        child: const SizedBox(
          height: 20,
          child: Row(
            children: [
              SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2)),
              SizedBox(width: 10),
              Text('Loading...', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
            ],
          ),
        ),
      );
}
