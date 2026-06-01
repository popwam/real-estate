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

class DealsListScreen extends ConsumerWidget {
  const DealsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deals = ref.watch(myDealsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My deals'),
        actions: [
          IconButton(
            tooltip: 'Refresh deals',
            onPressed: () => ref.invalidate(myDealsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: deals.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No deals yet',
              message: 'Sold and approved deals scoped to you appear here.',
              icon: Icons.receipt_long_outlined,
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myDealsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) => DealCard(deal: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: 'Deals unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myDealsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class DealCard extends StatelessWidget {
  const DealCard({super.key, required this.deal});

  final Deal deal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/deals/${deal.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      deal.project?.name ?? 'Project ${deal.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(deal.unit?.title ?? 'Unit ${deal.unitId}'),
              const SizedBox(height: 8),
              Text(moneyLabel(deal.finalPrice, currency: deal.currency)),
              const SizedBox(height: 8),
              Text(
                deal.soldAt == null
                    ? 'Created ${shortDateTime(deal.createdAt)}'
                    : 'Sold ${shortDateTime(deal.soldAt)}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: deal.status),
                  if (deal.dealRoomId.isNotEmpty)
                    Chip(label: Text('Room ${_shortId(deal.dealRoomId)}')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _shortId(String id) {
  return id.length <= 6 ? id : id.substring(0, 6);
}
