import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/deal_models.dart';
import '../data/deals_repository.dart';

class DealsListScreen extends ConsumerWidget {
  const DealsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deals = ref.watch(myDealsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myDeals),
        actions: [
          IconButton(
            tooltip: l10n.refreshDeals,
            onPressed: () => ref.invalidate(myDealsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: deals.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              title: l10n.noDealsYet,
              message: l10n.dealsAppearHere,
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
          title: l10n.dealsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myDealsProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
    final l10n = context.l10n;

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
                      deal.project?.name ?? '${l10n.project} ${deal.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(deal.unit?.title ?? '${l10n.unit} ${deal.unitId}'),
              const SizedBox(height: 8),
              Text(
                context.formatMoney(deal.finalPrice, currency: deal.currency),
              ),
              const SizedBox(height: 8),
              Text(
                deal.soldAt == null
                    ? l10n.createdAt(
                        context.formatShortDateTime(deal.createdAt),
                      )
                    : l10n.soldAt(context.formatShortDateTime(deal.soldAt)),
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
                    Chip(
                      label: Text(l10n.roomShortId(_shortId(deal.dealRoomId))),
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

String _shortId(String id) {
  return id.length <= 6 ? id : id.substring(0, 6);
}
