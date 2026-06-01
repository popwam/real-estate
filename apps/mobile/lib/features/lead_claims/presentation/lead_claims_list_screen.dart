import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/lead_claim_models.dart';
import '../data/lead_claims_repository.dart';

class LeadClaimsListScreen extends ConsumerWidget {
  const LeadClaimsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claims = ref.watch(myLeadClaimsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My lead claims'),
        actions: [
          IconButton(
            tooltip: 'Refresh claims',
            onPressed: () => ref.invalidate(myLeadClaimsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: claims.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No lead claims',
              message: 'Create a claim from a project or unit detail screen.',
              icon: Icons.person_search_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myLeadClaimsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) => LeadClaimCard(claim: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: 'Claims unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myLeadClaimsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class LeadClaimCard extends StatelessWidget {
  const LeadClaimCard({super.key, required this.claim});

  final LeadClaim claim;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/lead-claims/${claim.id}'),
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
                      claim.project?.name ?? 'Project ${claim.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(claim.unit?.title ?? 'No unit selected'),
              const SizedBox(height: 8),
              Text(claim.maskedPhone),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: claim.status),
                  Chip(label: Text('Expires ${shortDate(claim.expiresAt)}')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
