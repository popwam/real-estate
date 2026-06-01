import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/utils/money_formatters.dart';
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

    return Scaffold(
      appBar: AppBar(title: const Text('Deal')),
      body: deal.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [_DealDetailCard(deal: item)],
        ),
        error: (error, _) => EmptyState(
          title: 'Deal unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(dealDetailProvider(dealId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              deal.project?.name ?? 'Project ${deal.projectId}',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: deal.status),
                if (deal.unit?.status.isNotEmpty == true)
                  StatusChip(label: 'Unit ${deal.unit!.status}'),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              moneyLabel(deal.finalPrice, currency: deal.currency),
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 18),
            _Row(label: 'Unit', value: deal.unit?.title ?? deal.unitId),
            _Row(label: 'Deal room', value: deal.dealRoomId),
            _Row(label: 'Broker', value: deal.brokerName ?? '-'),
            _Row(label: 'Brokerage', value: deal.brokerageName ?? '-'),
            _Row(label: 'Client', value: deal.clientName ?? '-'),
            _Row(label: 'Created', value: shortDateTime(deal.createdAt)),
            if (deal.approvedAt != null)
              _Row(label: 'Approved', value: shortDateTime(deal.approvedAt)),
            if (deal.soldAt != null)
              _Row(label: 'Sold', value: shortDateTime(deal.soldAt)),
            if (deal.cancelledAt != null)
              _Row(label: 'Cancelled', value: shortDateTime(deal.cancelledAt)),
            if (deal.dealRoomId.isNotEmpty) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.push('/deal-rooms/${deal.dealRoomId}'),
                icon: const Icon(Icons.forum_outlined),
                label: const Text('Open Deal Room'),
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
