import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/deal_room_models.dart';
import '../data/deal_rooms_repository.dart';

class DealRoomDetailScreen extends ConsumerStatefulWidget {
  const DealRoomDetailScreen({super.key, required this.roomId});

  final String roomId;

  @override
  ConsumerState<DealRoomDetailScreen> createState() =>
      _DealRoomDetailScreenState();
}

class _DealRoomDetailScreenState extends ConsumerState<DealRoomDetailScreen> {
  final _messageController = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _inviteClient() async {
    try {
      await ref.read(dealRoomsRepositoryProvider).inviteClient(widget.roomId);
      ref.invalidate(dealRoomDetailProvider(widget.roomId));
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Client invite created.')),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(apiErrorMessage(error))),
      );
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      await ref.read(dealRoomsRepositoryProvider).updateStatus(widget.roomId, status);
      ref.invalidate(myDealRoomsProvider);
      ref.invalidate(dealRoomDetailProvider(widget.roomId));
      ref.invalidate(dealRoomMessagesProvider(widget.roomId));
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Deal room moved to $status.')),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(apiErrorMessage(error))),
      );
    }
  }

  Future<void> _sendMessage() async {
    final body = _messageController.text.trim();
    if (body.isEmpty) {
      return;
    }

    setState(() => _isSending = true);
    try {
      await ref.read(dealRoomsRepositoryProvider).createMessage(widget.roomId, body);
      _messageController.clear();
      ref.invalidate(dealRoomMessagesProvider(widget.roomId));
      ref.invalidate(myDealRoomsProvider);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(apiErrorMessage(error))),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final room = ref.watch(dealRoomDetailProvider(widget.roomId));
    final messages = ref.watch(dealRoomMessagesProvider(widget.roomId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Deal room'),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Deal room actions',
            onSelected: (value) {
              if (value == 'invite') {
                _inviteClient();
              } else {
                _updateStatus(value);
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'NEGOTIATION',
                child: Text('Move to negotiation'),
              ),
              PopupMenuItem(
                value: 'PENDING_APPROVAL',
                child: Text('Move to pending approval'),
              ),
              PopupMenuItem(
                value: 'invite',
                child: Text('Invite client'),
              ),
            ],
          ),
        ],
      ),
      body: room.when(
        data: (item) => Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(dealRoomDetailProvider(widget.roomId));
                  ref.invalidate(dealRoomMessagesProvider(widget.roomId));
                },
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _DealRoomSummary(room: item),
                    const SizedBox(height: 16),
                    _ParticipantsSection(participants: item.participants),
                    const SizedBox(height: 16),
                    Text(
                      'Messages',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 10),
                    messages.when(
                      data: (items) {
                        if (items.isEmpty) {
                          return const EmptyState(
                            title: 'No messages yet',
                            message: 'Messages and status updates appear here.',
                            icon: Icons.chat_bubble_outline,
                          );
                        }
                        return Column(
                          children: [
                            for (final message in items) ...[
                              _MessageBubble(message: message),
                              const SizedBox(height: 10),
                            ],
                          ],
                        );
                      },
                      error: (error, _) => EmptyState(
                        title: 'Messages unavailable',
                        message: apiErrorMessage(error),
                        icon: Icons.cloud_off_outlined,
                      ),
                      loading: () => const LinearProgressIndicator(),
                    ),
                  ],
                ),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        minLines: 1,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          labelText: 'Message',
                          prefixIcon: Icon(Icons.chat_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      tooltip: 'Send message',
                      onPressed: _isSending ? null : _sendMessage,
                      icon: _isSending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.send),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Deal room unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(dealRoomDetailProvider(widget.roomId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _DealRoomSummary extends StatelessWidget {
  const _DealRoomSummary({required this.room});

  final DealRoom room;

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
              room.project?.name ?? 'Project ${room.projectId}',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(room.unit?.title ?? 'Unit ${room.unitId}'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: room.status),
                if (room.reservationRequest?.status != null)
                  StatusChip(
                    label: 'Reservation ${room.reservationRequest!.status}',
                  ),
              ],
            ),
            const SizedBox(height: 16),
            _Row(label: 'Opened', value: shortDateTime(room.createdAt)),
            _Row(
              label: 'Client invite',
              value: room.clientInvitedAt == null
                  ? 'Not invited'
                  : shortDateTime(room.clientInvitedAt),
            ),
            _Row(label: 'Messages', value: '${room.messageCount ?? 0}'),
          ],
        ),
      ),
    );
  }
}

class _ParticipantsSection extends StatelessWidget {
  const _ParticipantsSection({required this.participants});

  final List<DealRoomParticipant> participants;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Participants', style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            if (participants.isEmpty)
              Text(
                'No participants returned yet.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              )
            else
              for (final participant in participants) ...[
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.person_outline),
                  title: Text(participant.displayName ?? participant.role),
                  subtitle: Text('${participant.role} · ${participant.status}'),
                ),
              ],
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final DealRoomMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSystem = message.type == DealRoomMessageType.system ||
        message.type == DealRoomMessageType.statusUpdate;

    return Align(
      alignment: isSystem ? Alignment.center : Alignment.centerLeft,
      child: Container(
        width: isSystem ? double.infinity : null,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSystem
              ? theme.colorScheme.surfaceContainerHighest
              : theme.colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment:
              isSystem ? CrossAxisAlignment.center : CrossAxisAlignment.start,
          children: [
            Text(message.body),
            const SizedBox(height: 4),
            Text(
              [
                message.senderName ?? message.messageType,
                shortDateTime(message.createdAt),
              ].join(' · '),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
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
