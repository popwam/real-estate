import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.leadClaimReleased)));
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.formatApiError(error))));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claim = ref.watch(leadClaimDetailProvider(claimId));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.leadClaim)),
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
              label: Text(l10n.createReservationRequest),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: item.isActive ? () => _release(context, ref) : null,
              icon: const Icon(Icons.logout),
              label: Text(l10n.releaseClaim),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: l10n.claimUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(leadClaimDetailProvider(claimId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
    final l10n = context.l10n;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              claim.project?.name ?? '${l10n.project} ${claim.projectId}',
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
            _Row(label: l10n.client, value: claim.clientName ?? '-'),
            _Row(label: l10n.phone, value: claim.maskedPhone),
            _Row(
              label: l10n.unit,
              value: claim.unit?.title ?? l10n.noUnitSelected,
            ),
            _Row(
              label: l10n.created,
              value: context.formatShortDateTime(claim.createdAt),
            ),
            _Row(
              label: l10n.expires,
              value: context.formatShortDate(claim.expiresAt),
            ),
            if (claim.releasedAt != null)
              _Row(
                label: l10n.released,
                value: context.formatShortDateTime(claim.releasedAt),
              ),
            if (claim.notes != null && claim.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(l10n.notes, style: theme.textTheme.titleSmall),
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
