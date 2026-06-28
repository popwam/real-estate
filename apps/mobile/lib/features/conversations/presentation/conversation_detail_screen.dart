import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
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

class _ConversationDetailScreenState
    extends ConsumerState<ConversationDetailScreen> {
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
    final conversation = ref.watch(
      conversationDetailProvider(widget.conversationId),
    );
    final messages = ref.watch(
      conversationMessagesProvider(widget.conversationId),
    );
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.conversation),
        actions: [
          IconButton(
            tooltip: l10n.refreshConversations,
            onPressed: () {
              ref.invalidate(conversationDetailProvider(widget.conversationId));
              ref.invalidate(
                conversationMessagesProvider(widget.conversationId),
              );
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
                    ? EmptyState(
                        title: l10n.noMessagesYet,
                        message: l10n.messagesAppearHere,
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
                  title: l10n.messagesUnavailable,
                  message: context.formatApiError(error),
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
                        decoration: InputDecoration(
                          hintText: l10n.writeMessage,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(
                      tooltip: l10n.sendMessage,
                      onPressed: _busy ? null : _sendMessage,
                      icon: const Icon(Icons.send),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: l10n.conversationUnavailable,
          message: context.formatApiError(error),
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
      setState(() => _message = context.formatApiError(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showStatusSheet({required String currentStatus}) async {
    final result = await showModalBottomSheet<_StatusUpdate>(
      context: context,
      builder: (context) =>
          _ConversationStatusSheet(currentStatus: currentStatus),
    );
    if (result == null) return;

    setState(() => _busy = true);
    try {
      await ref
          .read(conversationsRepositoryProvider)
          .updateStatus(
            widget.conversationId,
            status: result.status,
            statusNote: result.note,
          );
      ref.invalidate(conversationDetailProvider(widget.conversationId));
      setState(() => _message = context.l10n.conversationStatusUpdated);
    } catch (error) {
      setState(() => _message = context.formatApiError(error));
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
    final l10n = context.l10n;

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
                    child: Text(l10n.dismiss),
                  ),
                ],
              ),
            Text(
              conversation.project?.name ??
                  conversation.crmLead?.project?.name ??
                  l10n.crmConversation,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(conversation.crmLead?.client?.name ?? conversation.type),
            const SizedBox(height: 8),
            Text(
              l10n.updatedAt(
                context.formatShortDateTime(conversation.updatedAt),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StatusChip(label: conversation.status),
                Chip(label: Text(conversation.type)),
                if (conversation.shareToken != null)
                  Chip(label: Text(l10n.publicShareToken)),
              ],
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: onStatusPressed,
              icon: const Icon(Icons.edit_outlined),
              label: Text(l10n.updateStatus),
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
          ? AlignmentDirectional.centerStart
          : AlignmentDirectional.centerEnd,
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
                    context.formatShortDateTime(message.createdAt),
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
    final l10n = context.l10n;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.updateConversationStatus,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: InputDecoration(labelText: l10n.status),
              items: [
                DropdownMenuItem(value: 'OPEN', child: Text(l10n.open)),
                DropdownMenuItem(value: 'CLOSED', child: Text(l10n.closed)),
                DropdownMenuItem(value: 'ARCHIVED', child: Text(l10n.archived)),
              ],
              onChanged: (value) => setState(() => _status = value ?? _status),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: InputDecoration(labelText: l10n.statusNoteOptional),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(
                context,
              ).pop(_StatusUpdate(status: _status, note: _noteController.text)),
              child: Text(l10n.saveStatus),
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
