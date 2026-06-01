import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/reservation_request_models.dart';
import '../data/reservation_requests_repository.dart';

class ReservationRequestsListScreen extends ConsumerWidget {
  const ReservationRequestsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(myReservationRequestsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reservation requests'),
        actions: [
          IconButton(
            tooltip: 'Refresh requests',
            onPressed: () => ref.invalidate(myReservationRequestsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: requests.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No reservation requests',
              message: 'Create a request from an active lead claim.',
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
          title: 'Requests unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myReservationRequestsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
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
                      request.project?.name ?? 'Project ${request.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(request.unit?.title ?? 'Unit ${request.unitId}'),
              const SizedBox(height: 8),
              Text('Created ${shortDateTime(request.createdAt)}'),
              if (request.rejectionReason != null &&
                  request.rejectionReason!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Reason: ${request.rejectionReason}'),
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
