import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../features/auth/presentation/auth_controller.dart';
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
    final isSignedIn = ref.watch(authControllerProvider).state.isSignedIn;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.unit)),
      body: unit.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _UnitHeader(unit: item),
            const SizedBox(height: 18),
            Text(
              l10n.paymentDetails,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            PaymentPlansSection(paymentPlans: item.paymentPlans),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: item.project == null
                  ? null
                  : () {
                      final target =
                          '/lead-claims/new?projectId=${Uri.encodeComponent(item.project!.id)}&unitId=${Uri.encodeComponent(item.id)}';
                      if (!isSignedIn) {
                        context.push(
                          '/login?from=${Uri.encodeComponent(target)}',
                        );
                        return;
                      }
                      context.push(target);
                    },
              icon: Icon(isSignedIn ? Icons.person_add_alt_1 : Icons.login),
              label: Text(
                isSignedIn ? l10n.createLeadClaim : l10n.signInToRequest,
              ),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: l10n.unitUnavailable,
          message: context.formatApiError(error),
          icon: Icons.lock_outline,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(unitDetailProvider(unitId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
    final l10n = context.l10n;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(unit.title, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              unit.project?.name ?? l10n.projectPending,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              unit.basePrice == null
                  ? l10n.priceOnRequest
                  : context.formatMoney(
                      unit.basePrice,
                      currency: unit.currency,
                    ),
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _DetailRow(label: l10n.status, value: unit.status),
            _DetailRow(label: l10n.visibility, value: unit.visibility),
            if (unit.unitType != null)
              _DetailRow(label: l10n.type, value: unit.unitType!),
            if (unit.bedrooms != null)
              _DetailRow(
                label: l10n.bedrooms,
                value: context.formatNumber(unit.bedrooms!),
              ),
            if (unit.bathrooms != null)
              _DetailRow(
                label: l10n.bathrooms,
                value: context.formatNumber(unit.bathrooms!),
              ),
            if (unit.areaSqm != null)
              _DetailRow(
                label: l10n.area,
                value: l10n.sqmValue(
                  context.formatNumber(unit.areaSqm!, decimalDigits: 0),
                ),
              ),
            if (unit.floor != null)
              _DetailRow(
                label: l10n.floor,
                value: context.formatNumber(unit.floor!),
              ),
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
