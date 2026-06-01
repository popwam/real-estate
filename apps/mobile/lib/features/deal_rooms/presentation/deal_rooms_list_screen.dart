import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/deal_room_models.dart';
import '../data/deal_rooms_repository.dart';

class DealRoomsListScreen extends ConsumerWidget {
  const DealRoomsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rooms = ref.watch(myDealRoomsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Deal rooms'),
        actions: [
          IconButton(
            tooltip: 'Refresh deal rooms',
            onPressed: () => ref.invalidate(myDealRoomsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: rooms.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No deal rooms',
              message: 'Deal rooms appear here after an approved reservation is opened.',
              icon: Icons.forum_outlined,
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myDealRoomsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) => DealRoomCard(room: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: 'Deal rooms unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myDealRoomsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class DealRoomCard extends StatelessWidget {
  const DealRoomCard({super.key, required this.room});

  final DealRoom room;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/deal-rooms/${room.id}'),
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
                      room.project?.name ?? 'Project ${room.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(room.unit?.title ?? 'Unit ${room.unitId}'),
              const SizedBox(height: 8),
              Text('${room.participants.length} participants'),
              const SizedBox(height: 8),
              Text(
                room.lastMessage?.body ??
                    '${room.messageCount ?? 0} messages · opened ${shortDate(room.createdAt)}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              StatusChip(label: room.status),
            ],
          ),
        ),
      ),
    );
  }
}
