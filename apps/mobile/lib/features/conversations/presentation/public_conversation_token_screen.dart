import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/conversation_models.dart';
import '../data/conversations_repository.dart';

class PublicConversationTokenScreen extends ConsumerStatefulWidget {
  const PublicConversationTokenScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<PublicConversationTokenScreen> createState() =>
      _PublicConversationTokenScreenState();
}

class _PublicConversationTokenScreenState
    extends ConsumerState<PublicConversationTokenScreen> {
  final _senderNameController = TextEditingController();
  final _messageController = TextEditingController();
  bool _busy = false;
  String? _notice;
  String? _error;

  @override
  void dispose() {
    _senderNameController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final conversation = ref.watch(publicConversationProvider(widget.token));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Public conversation'),
        actions: [
          IconButton(
            tooltip: 'Refresh conversation',
            onPressed: () =>
                ref.invalidate(publicConversationProvider(widget.token)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: conversation.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.project?.name ?? 'Conversation',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'This shared conversation shows only public-safe chat fields.',
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        StatusChip(label: item.status),
                        Chip(label: Text(item.type)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (item.recentMessages.isEmpty)
              const EmptyState(
                title: 'No messages yet',
                message: 'Public-safe messages for this conversation appear here.',
                icon: Icons.chat_bubble_outline,
              )
            else
              for (final message in item.recentMessages)
                Card(
                  child: ListTile(
                    title: Text(message.body),
                    subtitle: Text(
                      [
                        message.sender?.displayName ?? message.sender?.publicRole,
                        shortDateTime(message.createdAt),
                      ].whereType<String>().join(' · '),
                    ),
                  ),
                ),
            const SizedBox(height: 12),
            if (item.statusType == ConversationStatus.open)
              _PublicReplyComposer(
                senderNameController: _senderNameController,
                messageController: _messageController,
                busy: _busy,
                notice: _notice,
                error: _error,
                onSend: _sendPublicReply,
                onDismissNotice: () => setState(() => _notice = null),
                onDismissError: () => setState(() => _error = null),
              )
            else
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('This conversation is closed.'),
                ),
              ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Conversation unavailable',
          message: apiErrorMessage(error),
          icon: Icons.link_off_outlined,
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Future<void> _sendPublicReply() async {
    final body = _messageController.text.trim();
    final senderName = _senderNameController.text.trim();

    setState(() {
      _notice = null;
      _error = null;
    });

    if (body.isEmpty) {
      setState(() => _error = 'Please enter a message before sending.');
      return;
    }

    if (body.length > 2000) {
      setState(
        () => _error = 'Message is too long. Please keep it under 2000 characters.',
      );
      return;
    }

    setState(() => _busy = true);
    try {
      await ref
          .read(conversationsRepositoryProvider)
          .postPublicConversationMessageByToken(
            widget.token,
            PublicConversationMessagePayload(
              body: body,
              senderName: senderName.isEmpty ? null : senderName,
            ),
          );
      _messageController.clear();
      ref.invalidate(publicConversationProvider(widget.token));
      setState(() => _notice = 'Message sent.');
    } catch (error) {
      setState(() => _error = _publicReplyErrorMessage(error));
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  String _publicReplyErrorMessage(Object error) {
    if (error is DioException) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 404) {
        return 'This conversation link is no longer available.';
      }
      if (statusCode == 429) {
        return 'Too many messages. Please try again shortly.';
      }
      if (statusCode == 400) {
        final message = apiErrorMessage(error);
        if (message.toLowerCase().contains('2000')) {
          return 'Message is too long. Please keep it under 2000 characters.';
        }
        return 'Please check your message and try again.';
      }
    }

    return 'Could not send your message. Please try again.';
  }
}

class _PublicReplyComposer extends StatelessWidget {
  const _PublicReplyComposer({
    required this.senderNameController,
    required this.messageController,
    required this.busy,
    required this.onSend,
    this.notice,
    this.error,
    this.onDismissNotice,
    this.onDismissError,
  });

  final TextEditingController senderNameController;
  final TextEditingController messageController;
  final bool busy;
  final String? notice;
  final String? error;
  final VoidCallback onSend;
  final VoidCallback? onDismissNotice;
  final VoidCallback? onDismissError;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Reply', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            TextField(
              controller: senderNameController,
              maxLength: 120,
              decoration: const InputDecoration(
                labelText: 'Your name optional',
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: messageController,
              minLines: 3,
              maxLines: 5,
              maxLength: 2000,
              decoration: const InputDecoration(
                labelText: 'Message',
                hintText: 'Write a plain-text reply',
              ),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: busy ? null : onSend,
              icon: busy
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_outlined),
              label: Text(busy ? 'Sending' : 'Send reply'),
            ),
            if (notice != null) ...[
              const SizedBox(height: 12),
              MaterialBanner(
                content: Text(notice!),
                leading: const Icon(Icons.check_circle_outline),
                actions: [
                  TextButton(
                    onPressed: onDismissNotice,
                    child: const Text('Dismiss'),
                  ),
                ],
              ),
            ],
            if (error != null) ...[
              const SizedBox(height: 12),
              MaterialBanner(
                content: Text(error!),
                leading: const Icon(Icons.error_outline),
                actions: [
                  TextButton(
                    onPressed: onDismissError,
                    child: const Text('Dismiss'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
