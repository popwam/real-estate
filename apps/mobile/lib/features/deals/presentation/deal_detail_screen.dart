import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/deal_models.dart';
import '../data/deals_repository.dart';

class DealDetailScreen extends ConsumerWidget {
  const DealDetailScreen({super.key, required this.dealId});

  final String dealId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deal = ref.watch(dealDetailProvider(dealId));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.deal)),
      body: deal.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [_DealDetailCard(deal: item)],
        ),
        error: (error, _) => EmptyState(
          title: l10n.dealUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(dealDetailProvider(dealId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _DealDetailCard extends StatelessWidget {
  const _DealDetailCard({required this.deal});

  final Deal deal;

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
            Text(
              deal.project?.name ?? '${l10n.project} ${deal.projectId}',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: deal.status),
                if (deal.unit?.status.isNotEmpty == true)
                  StatusChip(label: '${l10n.unit} ${deal.unit!.status}'),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              context.formatMoney(deal.finalPrice, currency: deal.currency),
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 18),
            _Row(label: l10n.unit, value: deal.unit?.title ?? deal.unitId),
            _Row(label: l10n.dealRoomLabel, value: deal.dealRoomId),
            _Row(label: l10n.broker, value: deal.brokerName ?? '-'),
            _Row(label: l10n.brokerage, value: deal.brokerageName ?? '-'),
            _Row(label: l10n.client, value: deal.clientName ?? '-'),
            _Row(
              label: l10n.created,
              value: context.formatShortDateTime(deal.createdAt),
            ),
            if (deal.approvedAt != null)
              _Row(
                label: l10n.approved,
                value: context.formatShortDateTime(deal.approvedAt),
              ),
            if (deal.soldAt != null)
              _Row(
                label: l10n.sold,
                value: context.formatShortDateTime(deal.soldAt),
              ),
            if (deal.cancelledAt != null)
              _Row(
                label: l10n.cancelled,
                value: context.formatShortDateTime(deal.cancelledAt),
              ),
            if (deal.dealRoomId.isNotEmpty) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.push('/deal-rooms/${deal.dealRoomId}'),
                icon: const Icon(Icons.forum_outlined),
                label: Text(l10n.openDealRoom),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Flexible(child: Text(value, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
