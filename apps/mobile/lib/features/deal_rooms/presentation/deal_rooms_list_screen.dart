import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/deal_room_models.dart';
import '../data/deal_rooms_repository.dart';

class DealRoomsListScreen extends ConsumerWidget {
  const DealRoomsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rooms = ref.watch(myDealRoomsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.dealRooms),
        actions: [
          IconButton(
            tooltip: l10n.refreshDealRooms,
            onPressed: () => ref.invalidate(myDealRoomsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: rooms.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              title: l10n.noDealRooms,
              message: l10n.dealRoomsAppearHere,
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
          title: l10n.dealRoomsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(myDealRoomsProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
    final l10n = context.l10n;

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
                      room.project?.name ?? '${l10n.project} ${room.projectId}',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(room.unit?.title ?? '${l10n.unit} ${room.unitId}'),
              const SizedBox(height: 8),
              Text(l10n.participantsCount(room.participants.length)),
              const SizedBox(height: 8),
              Text(
                room.lastMessage?.body ??
                    l10n.messagesOpenedSummary(
                      room.messageCount ?? 0,
                      context.formatShortDate(room.createdAt),
                    ),
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
