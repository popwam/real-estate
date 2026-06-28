import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/lead_claim_models.dart';
import '../data/lead_claims_repository.dart';

class LeadClaimsListScreen extends ConsumerWidget {
  const LeadClaimsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claims = ref.watch(myLeadClaimsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myLeadClaims),
        actions: [
          IconButton(
            tooltip: l10n.refreshLead,
            onPressed: () => ref.invalidate(myLeadClaimsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: claims.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              title: l10n.noLeadClaims,
              message: l10n.createClaimFromProjectOrUnit,
              icon: Icons.person_search_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myLeadClaimsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  LeadClaimCard(claim: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: l10n.claimsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myLeadClaimsProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
    final l10n = context.l10n;

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
                      claim.project?.name ??
                          '${l10n.project} ${claim.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(claim.unit?.title ?? l10n.noUnitSelected),
              const SizedBox(height: 8),
              Text(claim.maskedPhone),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: claim.status),
                  Chip(
                    label: Text(
                      l10n.expiresAt(context.formatShortDate(claim.expiresAt)),
                    ),
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
