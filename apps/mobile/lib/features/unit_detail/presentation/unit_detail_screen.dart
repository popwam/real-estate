import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../features/marketplace/data/marketplace_repository.dart';
import '../../../features/marketplace/presentation/payment_plans_section.dart';
import '../../../shared/widgets/empty_state.dart';

class UnitDetailScreen extends ConsumerWidget {
  const UnitDetailScreen({super.key, required this.unitId});

  final String unitId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unit = ref.watch(unitDetailProvider(unitId));

    return Scaffold(
      appBar: AppBar(title: const Text('Unit')),
      body: unit.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _UnitHeader(unit: item),
            const SizedBox(height: 18),
            Text('Payment details', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            PaymentPlansSection(paymentPlans: item.paymentPlans),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: item.project == null
                  ? null
                  : () => context.push(
                        '/lead-claims/new?projectId=${Uri.encodeComponent(item.project!.id)}&unitId=${Uri.encodeComponent(item.id)}',
                      ),
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text('Create Lead Claim'),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Unit unavailable',
          message: apiErrorMessage(error),
          icon: Icons.lock_outline,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(unitDetailProvider(unitId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _UnitHeader extends StatelessWidget {
  const _UnitHeader({required this.unit});

  final MarketplaceUnit unit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(unit.title, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              unit.project?.name ?? 'Project pending',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            Text(unit.priceLabel, style: theme.textTheme.titleLarge),
            const SizedBox(height: 16),
            _DetailRow(label: 'Status', value: unit.status),
            _DetailRow(label: 'Visibility', value: unit.visibility),
            if (unit.unitType != null)
              _DetailRow(label: 'Type', value: unit.unitType!),
            if (unit.bedrooms != null)
              _DetailRow(label: 'Bedrooms', value: unit.bedrooms.toString()),
            if (unit.bathrooms != null)
              _DetailRow(label: 'Bathrooms', value: unit.bathrooms.toString()),
            if (unit.areaSqm != null)
              _DetailRow(
                label: 'Area',
                value: '${unit.areaSqm!.toStringAsFixed(0)} sqm',
              ),
            if (unit.floor != null)
              _DetailRow(label: 'Floor', value: unit.floor.toString()),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Text(value, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}
