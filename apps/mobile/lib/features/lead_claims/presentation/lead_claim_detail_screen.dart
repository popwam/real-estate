import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../features/reservation_requests/presentation/reservation_request_form_screen.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/lead_claim_models.dart';
import '../data/lead_claims_repository.dart';

class LeadClaimDetailScreen extends ConsumerWidget {
  const LeadClaimDetailScreen({super.key, required this.claimId});

  final String claimId;

  Future<void> _release(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(leadClaimsRepositoryProvider).release(claimId);
      ref.invalidate(myLeadClaimsProvider);
      ref.invalidate(leadClaimDetailProvider(claimId));
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lead claim released.')),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(apiErrorMessage(error))),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claim = ref.watch(leadClaimDetailProvider(claimId));

    return Scaffold(
      appBar: AppBar(title: const Text('Lead claim')),
      body: claim.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ClaimDetailCard(claim: item),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: item.isActive
                  ? () => context.push(
                        '/reservation-requests/new',
                        extra: ReservationRequestDraft(claim: item),
                      )
                  : null,
              icon: const Icon(Icons.event_available),
              label: const Text('Create Reservation Request'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: item.isActive ? () => _release(context, ref) : null,
              icon: const Icon(Icons.logout),
              label: const Text('Release claim'),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Claim unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(leadClaimDetailProvider(claimId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _ClaimDetailCard extends StatelessWidget {
  const _ClaimDetailCard({required this.claim});

  final LeadClaim claim;

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
              claim.project?.name ?? 'Project ${claim.projectId}',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: claim.status),
                if (claim.source != null) Chip(label: Text(claim.source!)),
              ],
            ),
            const SizedBox(height: 16),
            _Row(label: 'Client', value: claim.clientName ?? '-'),
            _Row(label: 'Phone', value: claim.maskedPhone),
            _Row(label: 'Unit', value: claim.unit?.title ?? 'No unit selected'),
            _Row(label: 'Created', value: shortDateTime(claim.createdAt)),
            _Row(label: 'Expires', value: shortDate(claim.expiresAt)),
            if (claim.releasedAt != null)
              _Row(label: 'Released', value: shortDateTime(claim.releasedAt)),
            if (claim.notes != null && claim.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Notes', style: theme.textTheme.titleSmall),
              const SizedBox(height: 6),
              Text(claim.notes!),
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
