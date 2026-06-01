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

class CommissionsListScreen extends ConsumerWidget {
  const CommissionsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commissions = ref.watch(myCommissionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My commissions'),
        actions: [
          IconButton(
            tooltip: 'Refresh commissions',
            onPressed: () => ref.invalidate(myCommissionsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: commissions.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No commissions yet',
              message: 'Commission entries scoped to you appear here.',
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
          title: 'Commissions unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myCommissionsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
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
                      moneyLabel(commission.amount, currency: commission.currency),
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(commission.project?.name ?? 'Deal ${commission.dealId}'),
              const SizedBox(height: 8),
              Text('Created ${shortDateTime(commission.createdAt)}'),
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
