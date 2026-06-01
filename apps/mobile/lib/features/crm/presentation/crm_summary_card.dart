import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../data/crm_repository.dart';

class CrmSummaryCard extends ConsumerWidget {
  const CrmSummaryCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(crmSummaryProvider);

    return summary.when(
      data: (data) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.analytics_outlined),
                  const SizedBox(width: 8),
                  Text(
                    'CRM summary',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Refresh CRM summary',
                    onPressed: () => ref.invalidate(crmSummaryProvider),
                    icon: const Icon(Icons.refresh),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _SummaryPill(label: 'Total leads', value: data.totalLeads),
                  _SummaryPill(label: 'New', value: data.newLeads),
                  _SummaryPill(label: 'Claimed', value: data.claimedLeads),
                  _SummaryPill(label: 'Qualified', value: data.qualifiedLeads),
                  _SummaryPill(
                    label: 'Open chats',
                    value: data.openConversations,
                  ),
                  _SummaryPill(label: 'Today leads', value: data.todayNewLeads),
                  _SummaryPill(
                    label: 'Today messages',
                    value: data.todayNewMessages,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      error: (error, _) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('CRM summary unavailable: ${apiErrorMessage(error)}'),
        ),
      ),
      loading: () => const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: LinearProgressIndicator(),
        ),
      ),
    );
  }
}

class _SummaryPill extends StatelessWidget {
  const _SummaryPill({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: 112,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value.toString(),
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}
