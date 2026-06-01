import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/utils/money_formatters.dart';
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

    return Scaffold(
      appBar: AppBar(title: const Text('Commission')),
      body: commission.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [_CommissionDetailCard(commission: item)],
        ),
        error: (error, _) => EmptyState(
          title: 'Commission unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () =>
                ref.invalidate(commissionDetailProvider(commissionId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              moneyLabel(commission.amount, currency: commission.currency),
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
            _Row(label: 'Deal', value: commission.dealId),
            _Row(
              label: 'Project',
              value: commission.project?.name ??
                  commission.deal?.project?.name ??
                  '-',
            ),
            _Row(
              label: 'Unit',
              value:
                  commission.unit?.title ?? commission.deal?.unit?.title ?? '-',
            ),
            _Row(label: 'Created', value: shortDateTime(commission.createdAt)),
            if (commission.approvedAt != null)
              _Row(
                label: 'Approved',
                value: shortDateTime(commission.approvedAt),
              ),
            if (commission.rejectedAt != null)
              _Row(
                label: 'Rejected',
                value: shortDateTime(commission.rejectedAt),
              ),
            if (commission.rejectionReason != null &&
                commission.rejectionReason!.isNotEmpty)
              _Row(label: 'Reason', value: commission.rejectionReason!),
            if (commission.dealId.isNotEmpty) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.push('/deals/${commission.dealId}'),
                icon: const Icon(Icons.receipt_long_outlined),
                label: const Text('Open Deal'),
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
