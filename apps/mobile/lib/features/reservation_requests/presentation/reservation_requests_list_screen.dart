import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/reservation_request_models.dart';
import '../data/reservation_requests_repository.dart';

class ReservationRequestsListScreen extends ConsumerWidget {
  const ReservationRequestsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(myReservationRequestsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.reservationRequests),
        actions: [
          IconButton(
            tooltip: l10n.refreshRequests,
            onPressed: () => ref.invalidate(myReservationRequestsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: requests.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              title: l10n.noReservationRequests,
              message: l10n.createRequestFromLeadClaim,
              icon: Icons.event_note_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async =>
                ref.refresh(myReservationRequestsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  ReservationRequestCard(request: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: l10n.requestsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myReservationRequestsProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class ReservationRequestCard extends StatelessWidget {
  const ReservationRequestCard({super.key, required this.request});

  final ReservationRequest request;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/reservation-requests/${request.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      request.project?.name ??
                          '${l10n.project} ${request.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(request.unit?.title ?? '${l10n.unit} ${request.unitId}'),
              const SizedBox(height: 8),
              Text(
                l10n.createdAt(context.formatShortDateTime(request.createdAt)),
              ),
              if (request.rejectionReason != null &&
                  request.rejectionReason!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('${l10n.reason}: ${request.rejectionReason}'),
              ],
              const SizedBox(height: 12),
              StatusChip(label: request.status),
            ],
          ),
        ),
      ),
    );
  }
}
