import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/warehouse.dart';
import '../models/location.dart';
import '../providers/warehouse_provider.dart';
import '../services/admin_service.dart';
import '../utils/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prov = context.read<WarehouseProvider>();
      prov.fetchWarehouses();
      prov.fetchLocations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width >= 720;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppTheme.surface,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () {
              context.read<WarehouseProvider>().fetchWarehouses();
              context.read<WarehouseProvider>().fetchLocations();
            },
          ),
        ],
      ),
      body: isWide
          ? Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _WarehouseSection()),
                const VerticalDivider(
                    width: 1, color: AppTheme.border),
                Expanded(child: _LocationSection()),
              ],
            )
          : ListView(
              padding: EdgeInsets.zero,
              children: [
                _WarehouseSection(),
                const Divider(height: 1, color: AppTheme.border),
                _LocationSection(),
              ],
            ),
    );
  }
}

// ── Warehouse Section ─────────────────────────────────────────────────────────

class _WarehouseSection extends StatefulWidget {
  @override
  State<_WarehouseSection> createState() => _WarehouseSectionState();
}

class _WarehouseSectionState extends State<_WarehouseSection> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  final _addressController = TextEditingController();

  final AdminService _admin = AdminService();
  bool _saving = false;
  Warehouse? _editingWarehouse;

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _nameController.clear();
    _codeController.clear();
    _addressController.clear();
    setState(() => _editingWarehouse = null);
  }

  void _fillFormForEdit(Warehouse wh) {
    _nameController.text = wh.name;
    _codeController.text = wh.shortCode ?? '';
    _addressController.text = wh.address ?? '';
    setState(() => _editingWarehouse = wh);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      if (_editingWarehouse != null) {
        await _admin.updateWarehouse(
          id: _editingWarehouse!.id,
          name: _nameController.text.trim(),
          shortCode: _codeController.text.trim(),
          address: _addressController.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Warehouse updated.'),
                backgroundColor: AppTheme.accent),
          );
        }
      } else {
        await _admin.createWarehouse(
          name: _nameController.text.trim(),
          shortCode: _codeController.text.trim(),
          address: _addressController.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Warehouse created.'),
                backgroundColor: AppTheme.accent),
          );
        }
      }
      _clearForm();
      if (mounted) {
        await context.read<WarehouseProvider>().fetchWarehouses();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteWarehouse(Warehouse wh) async {
    final ok = await _confirmDelete(context, wh.name);
    if (!ok) return;
    try {
      await _admin.deleteWarehouse(wh.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Warehouse "${wh.name}" deleted.'),
              backgroundColor: AppTheme.warning),
        );
        if (_editingWarehouse?.id == wh.id) _clearForm();
        await context.read<WarehouseProvider>().fetchWarehouses();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: AppTheme.error),
        );
      }
    }
  }

  Future<bool> _confirmDelete(BuildContext context, String name) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppTheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: AppTheme.border),
            ),
            title: const Text('Confirm Delete',
                style: TextStyle(color: AppTheme.textPrimary)),
            content: Text('Delete "$name"? This cannot be undone.',
                style: const TextStyle(color: AppTheme.textSecondary)),
            actions: [
              TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const Text('Cancel',
                      style: TextStyle(color: AppTheme.textSecondary))),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error),
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    final warehouses = context.watch<WarehouseProvider>().warehouses;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          _SectionHeader(
            icon: Icons.warehouse_outlined,
            title: 'Warehouses',
            isEditing: _editingWarehouse != null,
            editingName: _editingWarehouse?.name,
          ),
          const SizedBox(height: 14),

          // Form
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _nameController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Warehouse Name *',
                      prefixIcon: Icon(Icons.warehouse_outlined),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Name is required'
                        : null,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _codeController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Short Code *',
                      hintText: 'e.g. WH-01',
                      prefixIcon: Icon(Icons.tag_outlined),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Short code is required'
                        : null,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _addressController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Address (optional)',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _saving ? null : _save,
                          icon: _saving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2))
                              : Icon(_editingWarehouse != null
                                  ? Icons.save_outlined
                                  : Icons.add),
                          label: Text(_saving
                              ? 'Saving...'
                              : _editingWarehouse != null
                                  ? 'Update'
                                  : 'Create'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: _clearForm,
                        child: const Text('New'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 18),

          // Table header
          if (warehouses.isNotEmpty) ...[
            _TableHeader(
              columns: const [
                _ColSpec('NAME', flex: 3),
                _ColSpec('CODE', flex: 2),
                _ColSpec('LOCS', flex: 1),
                _ColSpec('', flex: 1),
              ],
            ),
            const Divider(height: 1, color: AppTheme.border),
            ...warehouses.asMap().entries.map((e) {
              final idx = e.key;
              final wh = e.value;
              return Container(
                color: idx % 2 == 0
                    ? AppTheme.background
                    : AppTheme.surfaceVariant,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Text(wh.name,
                                style: const TextStyle(
                                    color: AppTheme.textPrimary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500),
                                overflow: TextOverflow.ellipsis),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text(wh.shortCode ?? '—',
                                style: const TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 12,
                                    fontFamily: 'monospace')),
                          ),
                          Expanded(
                            flex: 1,
                            child: Text(
                                '${wh.locations.length}',
                                style: const TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 13)),
                          ),
                          Expanded(
                            flex: 1,
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.end,
                              children: [
                                GestureDetector(
                                  onTap: () =>
                                      _fillFormForEdit(wh),
                                  child: const Icon(
                                      Icons.edit_outlined,
                                      size: 16,
                                      color: AppTheme.textSecondary),
                                ),
                                const SizedBox(width: 10),
                                GestureDetector(
                                  onTap: () =>
                                      _deleteWarehouse(wh),
                                  child: const Icon(
                                      Icons.delete_outline,
                                      size: 16,
                                      color: AppTheme.error),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: AppTheme.border),
                  ],
                ),
              );
            }),
          ] else
            const _EmptyTableState(
                message: 'No warehouses yet.',
                icon: Icons.warehouse_outlined),
        ],
      ),
    );
  }
}

// ── Location Section ──────────────────────────────────────────────────────────

class _LocationSection extends StatefulWidget {
  @override
  State<_LocationSection> createState() => _LocationSectionState();
}

class _LocationSectionState extends State<_LocationSection> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();

  final AdminService _admin = AdminService();
  bool _saving = false;
  Location? _editingLocation;
  Warehouse? _selectedWarehouse;

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _nameController.clear();
    _codeController.clear();
    setState(() {
      _editingLocation = null;
      _selectedWarehouse = null;
    });
  }

  void _fillFormForEdit(Location loc, List<Warehouse> warehouses) {
    _nameController.text = loc.name;
    _codeController.text = loc.shortCode ?? '';
    final wh = warehouses.where((w) => w.id == loc.warehouseId).firstOrNull;
    setState(() {
      _editingLocation = loc;
      _selectedWarehouse = wh;
    });
  }

  Future<void> _save(List<Warehouse> warehouses) async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Select a warehouse.'),
            backgroundColor: AppTheme.error),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      if (_editingLocation != null) {
        await _admin.updateLocation(
          id: _editingLocation!.id,
          name: _nameController.text.trim(),
          shortCode: _codeController.text.trim(),
          warehouseId: _selectedWarehouse!.id,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Location updated.'),
                backgroundColor: AppTheme.accent),
          );
        }
      } else {
        await _admin.createLocation(
          warehouseId: _selectedWarehouse!.id,
          name: _nameController.text.trim(),
          shortCode: _codeController.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Location created.'),
                backgroundColor: AppTheme.accent),
          );
        }
      }
      _clearForm();
      if (mounted) {
        final prov = context.read<WarehouseProvider>();
        await prov.fetchWarehouses();
        await prov.fetchLocations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteLocation(Location loc) async {
    final ok = await _confirmDelete(context, loc.name);
    if (!ok) return;
    try {
      await _admin.deleteLocation(loc.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Location "${loc.name}" deleted.'),
              backgroundColor: AppTheme.warning),
        );
        if (_editingLocation?.id == loc.id) _clearForm();
        final prov = context.read<WarehouseProvider>();
        await prov.fetchWarehouses();
        await prov.fetchLocations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: AppTheme.error),
        );
      }
    }
  }

  Future<bool> _confirmDelete(BuildContext context, String name) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppTheme.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: AppTheme.border),
            ),
            title: const Text('Confirm Delete',
                style: TextStyle(color: AppTheme.textPrimary)),
            content: Text('Delete "$name"? This cannot be undone.',
                style: const TextStyle(color: AppTheme.textSecondary)),
            actions: [
              TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const Text('Cancel',
                      style: TextStyle(color: AppTheme.textSecondary))),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error),
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<WarehouseProvider>();
    final warehouses = prov.warehouses;
    final locations = prov.locations;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(
            icon: Icons.location_on_outlined,
            title: 'Locations',
            isEditing: _editingLocation != null,
            editingName: _editingLocation?.name,
          ),
          const SizedBox(height: 14),

          // Form
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _nameController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Location Name *',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Name is required'
                        : null,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _codeController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Short Code (optional)',
                      hintText: 'e.g. A-01',
                      prefixIcon: Icon(Icons.tag_outlined),
                    ),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<Warehouse>(
                    value: _selectedWarehouse,
                    dropdownColor: AppTheme.surface,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'Warehouse *',
                      prefixIcon: Icon(Icons.warehouse_outlined),
                    ),
                    hint: const Text('Select warehouse',
                        style:
                            TextStyle(color: AppTheme.textSecondary)),
                    isExpanded: true,
                    items: warehouses
                        .map((w) => DropdownMenuItem(
                              value: w,
                              child: Text(w.name,
                                  overflow: TextOverflow.ellipsis),
                            ))
                        .toList(),
                    onChanged: (v) =>
                        setState(() => _selectedWarehouse = v),
                    validator: (v) =>
                        v == null ? 'Select a warehouse' : null,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _saving
                              ? null
                              : () => _save(warehouses),
                          icon: _saving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2))
                              : Icon(_editingLocation != null
                                  ? Icons.save_outlined
                                  : Icons.add),
                          label: Text(_saving
                              ? 'Saving...'
                              : _editingLocation != null
                                  ? 'Update'
                                  : 'Create'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: _clearForm,
                        child: const Text('New'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 18),

          // Table
          if (locations.isNotEmpty) ...[
            _TableHeader(
              columns: const [
                _ColSpec('NAME', flex: 3),
                _ColSpec('WAREHOUSE', flex: 3),
                _ColSpec('', flex: 1),
              ],
            ),
            const Divider(height: 1, color: AppTheme.border),
            ...locations.asMap().entries.map((e) {
              final idx = e.key;
              final loc = e.value;
              return Container(
                color: idx % 2 == 0
                    ? AppTheme.background
                    : AppTheme.surfaceVariant,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text(loc.name,
                                    style: const TextStyle(
                                        color: AppTheme.textPrimary,
                                        fontSize: 13,
                                        fontWeight:
                                            FontWeight.w500),
                                    overflow: TextOverflow.ellipsis),
                                if (loc.shortCode != null &&
                                    loc.shortCode!.isNotEmpty)
                                  Text(loc.shortCode!,
                                      style: const TextStyle(
                                          color:
                                              AppTheme.textSecondary,
                                          fontSize: 11,
                                          fontFamily: 'monospace')),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Text(
                                loc.warehouseName ?? '—',
                                style: const TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 12),
                                overflow: TextOverflow.ellipsis),
                          ),
                          Expanded(
                            flex: 1,
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.end,
                              children: [
                                GestureDetector(
                                  onTap: () => _fillFormForEdit(
                                      loc, warehouses),
                                  child: const Icon(
                                      Icons.edit_outlined,
                                      size: 16,
                                      color: AppTheme.textSecondary),
                                ),
                                const SizedBox(width: 10),
                                GestureDetector(
                                  onTap: () =>
                                      _deleteLocation(loc),
                                  child: const Icon(
                                      Icons.delete_outline,
                                      size: 16,
                                      color: AppTheme.error),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: AppTheme.border),
                  ],
                ),
              );
            }),
          ] else
            const _EmptyTableState(
                message: 'No locations yet.',
                icon: Icons.location_off_outlined),
        ],
      ),
    );
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool isEditing;
  final String? editingName;

  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.isEditing,
    this.editingName,
  });

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.accent),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          if (isEditing) ...[
            const SizedBox(width: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.info.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppTheme.info.withOpacity(0.3)),
              ),
              child: Text(
                'Editing: ${editingName ?? ''}',
                style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.info,
                    fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ],
      );
}

class _ColSpec {
  final String label;
  final int flex;
  const _ColSpec(this.label, {required this.flex});
}

class _TableHeader extends StatelessWidget {
  final List<_ColSpec> columns;
  const _TableHeader({required this.columns});

  @override
  Widget build(BuildContext context) => Container(
        color: AppTheme.surfaceVariant,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: columns
              .map((c) => Expanded(
                    flex: c.flex,
                    child: Text(c.label,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textSecondary,
                          letterSpacing: 0.5,
                        )),
                  ))
              .toList(),
        ),
      );
}

class _EmptyTableState extends StatelessWidget {
  final String message;
  final IconData icon;
  const _EmptyTableState({required this.message, required this.icon});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 40, color: AppTheme.textSecondary),
              const SizedBox(height: 8),
              Text(message,
                  style: const TextStyle(
                      color: AppTheme.textSecondary, fontSize: 13)),
            ],
          ),
        ),
      );
}
