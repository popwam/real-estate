import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/marketplace_models.dart';
import '../data/marketplace_repository.dart';
import 'marketplace_filters_sheet.dart';

class UnitsListScreen extends ConsumerWidget {
  const UnitsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final units = ref.watch(marketplaceUnitsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Units'),
        actions: [
          const MarketplaceFiltersButton(),
          IconButton(
            tooltip: 'Refresh units',
            onPressed: () => ref.invalidate(marketplaceUnitsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: units.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No visible units',
              message: 'Available inventory appears here after API visibility checks.',
              icon: Icons.home_work_outlined,
              action: MarketplaceFiltersButton(),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(marketplaceUnitsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) => UnitCard(unit: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: 'Units unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(marketplaceUnitsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class UnitCard extends StatelessWidget {
  const UnitCard({super.key, required this.unit});

  final MarketplaceUnit unit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/units/${unit.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(unit.title, style: theme.textTheme.titleMedium),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                unit.project?.name ?? 'Project pending',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Text(unit.priceLabel, style: theme.textTheme.titleSmall),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (unit.unitType != null) _InfoChip(label: unit.unitType!),
                  if (unit.bedrooms != null) _InfoChip(label: '${unit.bedrooms} bed'),
                  if (unit.areaSqm != null)
                    _InfoChip(label: '${unit.areaSqm!.toStringAsFixed(0)} sqm'),
                  _InfoChip(label: unit.status),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
    );
  }
}
