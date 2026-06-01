import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/conversations_repository.dart';
import '../data/conversation_models.dart';

class ConversationDetailScreen extends ConsumerStatefulWidget {
  const ConversationDetailScreen({super.key, required this.conversationId});

  final String conversationId;

  @override
  ConsumerState<ConversationDetailScreen> createState() =>
      _ConversationDetailScreenState();
}

class _ConversationDetailScreenState extends ConsumerState<ConversationDetailScreen> {
  final _messageController = TextEditingController();
  bool _busy = false;
  String? _message;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final conversation = ref.watch(conversationDetailProvider(widget.conversationId));
    final messages = ref.watch(conversationMessagesProvider(widget.conversationId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Conversation'),
        actions: [
          IconButton(
            tooltip: 'Refresh conversation',
            onPressed: () {
              ref.invalidate(conversationDetailProvider(widget.conversationId));
              ref.invalidate(conversationMessagesProvider(widget.conversationId));
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: conversation.when(
        data: (item) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: _ConversationHeader(
                conversation: item,
                message: _message,
                onDismissMessage: () => setState(() => _message = null),
                onStatusPressed: _busy
                    ? null
                    : () => _showStatusSheet(currentStatus: item.status),
              ),
            ),
            Expanded(
              child: messages.when(
                data: (items) => items.isEmpty
                    ? const EmptyState(
                        title: 'No messages yet',
                        message: 'Messages in this conversation appear here.',
                        icon: Icons.chat_bubble_outline,
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: items.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 10),
                        itemBuilder: (context, index) =>
                            _MessageBubble(message: items[index]),
                      ),
                error: (error, _) => EmptyState(
                  title: 'Messages unavailable',
                  message: apiErrorMessage(error),
                  icon: Icons.cloud_off_outlined,
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        minLines: 1,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          hintText: 'Write a message',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: _busy ? null : _sendMessage,
                      child: const Text('Send'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Conversation unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Future<void> _sendMessage() async {
    final body = _messageController.text.trim();
    if (body.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(conversationsRepositoryProvider)
          .createMessage(widget.conversationId, body);
      _messageController.clear();
      ref.invalidate(conversationMessagesProvider(widget.conversationId));
      ref.invalidate(conversationDetailProvider(widget.conversationId));
    } catch (error) {
      setState(() => _message = apiErrorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showStatusSheet({required String currentStatus}) async {
    final result = await showModalBottomSheet<_StatusUpdate>(
      context: context,
      builder: (context) => _ConversationStatusSheet(currentStatus: currentStatus),
    );
    if (result == null) return;

    setState(() => _busy = true);
    try {
      await ref.read(conversationsRepositoryProvider).updateStatus(
            widget.conversationId,
            status: result.status,
            statusNote: result.note,
          );
      ref.invalidate(conversationDetailProvider(widget.conversationId));
      setState(() => _message = 'Conversation status updated.');
    } catch (error) {
      setState(() => _message = apiErrorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

class _ConversationHeader extends StatelessWidget {
  const _ConversationHeader({
    required this.conversation,
    required this.onStatusPressed,
    this.message,
    this.onDismissMessage,
  });

  final Conversation conversation;
  final VoidCallback? onStatusPressed;
  final String? message;
  final VoidCallback? onDismissMessage;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message != null)
              MaterialBanner(
                content: Text(message!),
                actions: [
                  TextButton(
                    onPressed: onDismissMessage,
                    child: const Text('Dismiss'),
                  ),
                ],
              ),
            Text(
              conversation.project?.name ??
                  conversation.crmLead?.project?.name ??
                  'CRM conversation',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(conversation.crmLead?.client?.name ?? conversation.type),
            const SizedBox(height: 8),
            Text('Updated ${shortDateTime(conversation.updatedAt)}'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: conversation.status),
                Chip(label: Text(conversation.type)),
                if (conversation.shareToken != null)
                  const Chip(label: Text('Public share token')),
              ],
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onStatusPressed,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Update status'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ConversationMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Align(
      alignment: message.sender?.publicRole == 'CLIENT'
          ? Alignment.centerLeft
          : Alignment.centerRight,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(message.body),
                const SizedBox(height: 6),
                Text(
                  [
                    message.sender?.displayName ?? message.sender?.publicRole,
                    shortDateTime(message.createdAt),
                  ].whereType<String>().join(' · '),
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ConversationStatusSheet extends StatefulWidget {
  const _ConversationStatusSheet({required this.currentStatus});

  final String currentStatus;

  @override
  State<_ConversationStatusSheet> createState() =>
      _ConversationStatusSheetState();
}

class _ConversationStatusSheetState extends State<_ConversationStatusSheet> {
  late String _status = widget.currentStatus;
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Update conversation status',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'OPEN', child: Text('Open')),
                DropdownMenuItem(value: 'CLOSED', child: Text('Closed')),
                DropdownMenuItem(value: 'ARCHIVED', child: Text('Archived')),
              ],
              onChanged: (value) => setState(() => _status = value ?? _status),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Status note optional'),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(
                _StatusUpdate(status: _status, note: _noteController.text),
              ),
              child: const Text('Save status'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusUpdate {
  const _StatusUpdate({required this.status, required this.note});

  final String status;
  final String note;
}
