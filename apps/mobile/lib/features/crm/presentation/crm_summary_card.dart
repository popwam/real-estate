import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../data/crm_repository.dart';

class CrmSummaryCard extends ConsumerWidget {
  const CrmSummaryCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(crmSummaryProvider);
    final l10n = context.l10n;

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
                    l10n.crmSummary,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: l10n.refreshCrmSummary,
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
                  _SummaryPill(label: l10n.totalLeads, value: data.totalLeads),
                  _SummaryPill(label: l10n.newLeads, value: data.newLeads),
                  _SummaryPill(label: l10n.claimed, value: data.claimedLeads),
                  _SummaryPill(
                    label: l10n.qualifiedLeads,
                    value: data.qualifiedLeads,
                  ),
                  _SummaryPill(
                    label: l10n.openChats,
                    value: data.openConversations,
                  ),
                  _SummaryPill(
                    label: l10n.todayLeads,
                    value: data.todayNewLeads,
                  ),
                  _SummaryPill(
                    label: l10n.todayMessages,
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
          child: Text(
            l10n.crmSummaryUnavailable(context.formatApiError(error)),
          ),
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
          Text(context.formatNumber(value), style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}
