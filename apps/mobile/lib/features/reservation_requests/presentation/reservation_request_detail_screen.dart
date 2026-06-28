import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../features/deal_rooms/data/deal_rooms_repository.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/reservation_request_models.dart';
import '../data/reservation_requests_repository.dart';

class ReservationRequestDetailScreen extends ConsumerWidget {
  const ReservationRequestDetailScreen({super.key, required this.requestId});

  final String requestId;

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(reservationRequestsRepositoryProvider).cancel(requestId);
      ref.invalidate(myReservationRequestsProvider);
      ref.invalidate(reservationRequestDetailProvider(requestId));
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.reservationRequestCancelled)),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.formatApiError(error))));
    }
  }

  Future<void> _createDealRoom(BuildContext context, WidgetRef ref) async {
    try {
      final room = await ref
          .read(dealRoomsRepositoryProvider)
          .createFromReservation(requestId);
      ref.invalidate(myDealRoomsProvider);
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.dealRoomCreated)));
      context.go('/deal-rooms/${room.id}');
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
    final request = ref.watch(reservationRequestDetailProvider(requestId));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.reservationRequest)),
      body: request.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _RequestDetailCard(request: item),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: item.statusType == ReservationRequestStatus.approved
                  ? () => _createDealRoom(context, ref)
                  : null,
              icon: const Icon(Icons.forum_outlined),
              label: Text(l10n.createDealRoom),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: item.isPending ? () => _cancel(context, ref) : null,
              icon: const Icon(Icons.cancel_outlined),
              label: Text(l10n.cancelRequest),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: l10n.requestUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () =>
                ref.invalidate(reservationRequestDetailProvider(requestId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _RequestDetailCard extends StatelessWidget {
  const _RequestDetailCard({required this.request});

  final ReservationRequest request;

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
              request.project?.name ?? '${l10n.project} ${request.projectId}',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            StatusChip(label: request.status),
            const SizedBox(height: 16),
            _Row(
              label: l10n.unit,
              value: request.unit?.title ?? request.unitId,
            ),
            _Row(
              label: l10n.created,
              value: context.formatShortDateTime(request.createdAt),
            ),
            if (request.approvedAt != null)
              _Row(
                label: l10n.approved,
                value: context.formatShortDateTime(request.approvedAt),
              ),
            if (request.rejectedAt != null)
              _Row(
                label: l10n.rejected,
                value: context.formatShortDateTime(request.rejectedAt),
              ),
            if (request.cancelledAt != null)
              _Row(
                label: l10n.cancelled,
                value: context.formatShortDateTime(request.cancelledAt),
              ),
            if (request.rejectionReason != null &&
                request.rejectionReason!.isNotEmpty)
              _Row(label: l10n.reason, value: request.rejectionReason!),
            if (request.notes != null && request.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(l10n.notes, style: theme.textTheme.titleSmall),
              const SizedBox(height: 6),
              Text(request.notes!),
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
