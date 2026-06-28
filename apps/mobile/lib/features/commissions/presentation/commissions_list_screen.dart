import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/commission_models.dart';
import '../data/commissions_repository.dart';

class CommissionsListScreen extends ConsumerWidget {
  const CommissionsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commissions = ref.watch(myCommissionsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myCommissions),
        actions: [
          IconButton(
            tooltip: l10n.refreshCommissions,
            onPressed: () => ref.invalidate(myCommissionsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: commissions.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              title: l10n.noCommissionsYet,
              message: l10n.commissionsAppearHere,
              icon: Icons.payments_outlined,
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myCommissionsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  CommissionCard(commission: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: l10n.commissionsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myCommissionsProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class CommissionCard extends StatelessWidget {
  const CommissionCard({super.key, required this.commission});

  final CommissionEntry commission;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/commissions/${commission.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      context.formatMoney(
                        commission.amount,
                        currency: commission.currency,
                      ),
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                commission.project?.name ?? '${l10n.deal} ${commission.dealId}',
              ),
              const SizedBox(height: 8),
              Text(
                l10n.createdAt(
                  context.formatShortDateTime(commission.createdAt),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: commission.status),
                  Chip(label: Text(commission.partyType)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
