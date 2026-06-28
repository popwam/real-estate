import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/commission_models.dart';
import '../data/commissions_repository.dart';

class CommissionDetailScreen extends ConsumerWidget {
  const CommissionDetailScreen({super.key, required this.commissionId});

  final String commissionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commission = ref.watch(commissionDetailProvider(commissionId));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.commission)),
      body: commission.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [_CommissionDetailCard(commission: item)],
        ),
        error: (error, _) => EmptyState(
          title: l10n.commissionUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () =>
                ref.invalidate(commissionDetailProvider(commissionId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _CommissionDetailCard extends StatelessWidget {
  const _CommissionDetailCard({required this.commission});

  final CommissionEntry commission;

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
              context.formatMoney(
                commission.amount,
                currency: commission.currency,
              ),
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: commission.status),
                Chip(label: Text(commission.partyType)),
                if (commission.commissionType != null)
                  Chip(label: Text(commission.commissionType!)),
              ],
            ),
            const SizedBox(height: 18),
            _Row(label: l10n.deal, value: commission.dealId),
            _Row(
              label: l10n.project,
              value:
                  commission.project?.name ??
                  commission.deal?.project?.name ??
                  '-',
            ),
            _Row(
              label: l10n.unit,
              value:
                  commission.unit?.title ?? commission.deal?.unit?.title ?? '-',
            ),
            _Row(
              label: l10n.created,
              value: context.formatShortDateTime(commission.createdAt),
            ),
            if (commission.approvedAt != null)
              _Row(
                label: l10n.approved,
                value: context.formatShortDateTime(commission.approvedAt),
              ),
            if (commission.rejectedAt != null)
              _Row(
                label: l10n.rejected,
                value: context.formatShortDateTime(commission.rejectedAt),
              ),
            if (commission.rejectionReason != null &&
                commission.rejectionReason!.isNotEmpty)
              _Row(label: l10n.reason, value: commission.rejectionReason!),
            if (commission.dealId.isNotEmpty) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.push('/deals/${commission.dealId}'),
                icon: const Icon(Icons.receipt_long_outlined),
                label: Text(l10n.openDeal),
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
