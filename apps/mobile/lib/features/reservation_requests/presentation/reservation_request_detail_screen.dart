import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
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
        const SnackBar(content: Text('Reservation request cancelled.')),
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

  Future<void> _createDealRoom(BuildContext context, WidgetRef ref) async {
    try {
      final room = await ref
          .read(dealRoomsRepositoryProvider)
          .createFromReservation(requestId);
      ref.invalidate(myDealRoomsProvider);
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Deal room created.')),
      );
      context.go('/deal-rooms/${room.id}');
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
    final request = ref.watch(reservationRequestDetailProvider(requestId));

    return Scaffold(
      appBar: AppBar(title: const Text('Reservation request')),
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
              label: const Text('Create Deal Room'),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: item.isPending ? () => _cancel(context, ref) : null,
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Cancel request'),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Request unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () =>
                ref.invalidate(reservationRequestDetailProvider(requestId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              request.project?.name ?? 'Project ${request.projectId}',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            StatusChip(label: request.status),
            const SizedBox(height: 16),
            _Row(label: 'Unit', value: request.unit?.title ?? request.unitId),
            _Row(label: 'Created', value: shortDateTime(request.createdAt)),
            if (request.approvedAt != null)
              _Row(label: 'Approved', value: shortDateTime(request.approvedAt)),
            if (request.rejectedAt != null)
              _Row(label: 'Rejected', value: shortDateTime(request.rejectedAt)),
            if (request.cancelledAt != null)
              _Row(label: 'Cancelled', value: shortDateTime(request.cancelledAt)),
            if (request.rejectionReason != null &&
                request.rejectionReason!.isNotEmpty)
              _Row(label: 'Reason', value: request.rejectionReason!),
            if (request.notes != null && request.notes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Notes', style: theme.textTheme.titleSmall),
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
