import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
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
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.publicConversation),
        actions: [
          IconButton(
            tooltip: l10n.refreshConversations,
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
                      item.project?.name ?? l10n.conversation,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(l10n.thisSharedConversation),
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
              EmptyState(
                title: l10n.noMessagesYet,
                message: l10n.publicSafeMessagesAppearHere,
                icon: Icons.chat_bubble_outline,
              )
            else
              for (final message in item.recentMessages)
                Card(
                  child: ListTile(
                    title: Text(message.body),
                    subtitle: Text(
                      [
                        message.sender?.displayName ??
                            message.sender?.publicRole,
                        context.formatShortDateTime(message.createdAt),
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
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(l10n.conversationClosed),
                ),
              ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: l10n.conversationUnavailable,
          message: context.formatApiError(error),
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
      setState(() => _error = context.l10n.enterMessageBeforeSending);
      return;
    }

    if (body.length > 2000) {
      setState(() => _error = context.l10n.messageTooLong);
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
      setState(() => _notice = context.l10n.messageSent);
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
        return context.l10n.conversationLinkUnavailable;
      }
      if (statusCode == 429) {
        return context.l10n.tooManyMessages;
      }
      if (statusCode == 400) {
        final message = context.formatApiError(error);
        if (message.toLowerCase().contains('2000')) {
          return context.l10n.messageTooLong;
        }
        return context.l10n.checkMessageTryAgain;
      }
    }

    return context.l10n.couldNotSendMessage;
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
    final l10n = context.l10n;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.reply, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            TextField(
              controller: senderNameController,
              maxLength: 120,
              decoration: InputDecoration(labelText: l10n.yourNameOptional),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: messageController,
              minLines: 3,
              maxLines: 5,
              maxLength: 2000,
              decoration: InputDecoration(
                labelText: l10n.message,
                hintText: l10n.writePlainTextReply,
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
              label: Text(busy ? l10n.sending : l10n.sendReply),
            ),
            if (notice != null) ...[
              const SizedBox(height: 12),
              MaterialBanner(
                content: Text(notice!),
                leading: const Icon(Icons.check_circle_outline),
                actions: [
                  TextButton(
                    onPressed: onDismissNotice,
                    child: Text(l10n.dismiss),
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
                    child: Text(l10n.dismiss),
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
