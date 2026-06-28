import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../data/marketplace_filters.dart';

class MarketplaceFiltersButton extends ConsumerWidget {
  const MarketplaceFiltersButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filters = ref.watch(marketplaceFiltersProvider);
    final l10n = context.l10n;

    return IconButton(
      tooltip: l10n.filters,
      onPressed: () => showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (_) => const MarketplaceFiltersSheet(),
      ),
      icon: Badge.count(
        count: filters.activeCount,
        isLabelVisible: filters.activeCount > 0,
        child: const Icon(Icons.tune),
      ),
    );
  }
}

class MarketplaceFiltersSheet extends ConsumerStatefulWidget {
  const MarketplaceFiltersSheet({super.key});

  @override
  ConsumerState<MarketplaceFiltersSheet> createState() =>
      _MarketplaceFiltersSheetState();
}

class _MarketplaceFiltersSheetState
    extends ConsumerState<MarketplaceFiltersSheet> {
  late final TextEditingController _city;
  late final TextEditingController _district;
  late final TextEditingController _unitType;
  late final TextEditingController _minPrice;
  late final TextEditingController _maxPrice;
  late final TextEditingController _bedrooms;
  late final TextEditingController _areaMin;
  late final TextEditingController _areaMax;

  @override
  void initState() {
    super.initState();
    final filters = ref.read(marketplaceFiltersProvider);
    _city = TextEditingController(text: filters.city);
    _district = TextEditingController(text: filters.district);
    _unitType = TextEditingController(text: filters.unitType);
    _minPrice = TextEditingController(text: filters.minPrice);
    _maxPrice = TextEditingController(text: filters.maxPrice);
    _bedrooms = TextEditingController(text: filters.bedrooms);
    _areaMin = TextEditingController(text: filters.areaMin);
    _areaMax = TextEditingController(text: filters.areaMax);
  }

  @override
  void dispose() {
    _city.dispose();
    _district.dispose();
    _unitType.dispose();
    _minPrice.dispose();
    _maxPrice.dispose();
    _bedrooms.dispose();
    _areaMin.dispose();
    _areaMax.dispose();
    super.dispose();
  }

  void _apply() {
    ref
        .read(marketplaceFiltersProvider.notifier)
        .setFilters(
          MarketplaceFilters(
            city: _clean(_city),
            district: _clean(_district),
            unitType: _clean(_unitType),
            minPrice: _clean(_minPrice),
            maxPrice: _clean(_maxPrice),
            bedrooms: _clean(_bedrooms),
            areaMin: _clean(_areaMin),
            areaMax: _clean(_areaMax),
          ),
        );
    Navigator.of(context).pop();
  }

  void _clear() {
    ref.read(marketplaceFiltersProvider.notifier).clear();
    Navigator.of(context).pop();
  }

  String? _clean(TextEditingController controller) {
    final value = controller.text.trim();
    return value.isEmpty ? null : value;
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final l10n = context.l10n;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottomInset),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.marketplaceFilters,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    tooltip: l10n.closeFilters,
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _Field(controller: _city, label: l10n.city),
              _Field(controller: _district, label: l10n.district),
              _Field(controller: _unitType, label: l10n.unitType),
              _Field(
                controller: _minPrice,
                label: l10n.minPrice,
                keyboardType: TextInputType.number,
              ),
              _Field(
                controller: _maxPrice,
                label: l10n.maxPrice,
                keyboardType: TextInputType.number,
              ),
              _Field(
                controller: _bedrooms,
                label: l10n.bedrooms,
                keyboardType: TextInputType.number,
              ),
              _Field(
                controller: _areaMin,
                label: l10n.minArea,
                keyboardType: TextInputType.number,
              ),
              _Field(
                controller: _areaMax,
                label: l10n.maxArea,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _clear,
                      icon: const Icon(Icons.clear),
                      label: Text(l10n.clear),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _apply,
                      icon: const Icon(Icons.check),
                      label: Text(l10n.apply),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.label,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}
