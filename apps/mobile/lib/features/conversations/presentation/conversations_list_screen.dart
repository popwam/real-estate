import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/conversation_models.dart';
import '../data/conversations_repository.dart';

class ConversationsListScreen extends ConsumerStatefulWidget {
  const ConversationsListScreen({super.key});

  @override
  ConsumerState<ConversationsListScreen> createState() =>
      _ConversationsListScreenState();
}

class _ConversationsListScreenState
    extends ConsumerState<ConversationsListScreen> {
  String? _status;

  @override
  Widget build(BuildContext context) {
    final filters = ConversationFilters(status: _status);
    final conversations = ref.watch(conversationsProvider(filters));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.crmConversations),
        actions: [
          IconButton(
            tooltip: l10n.refreshConversations,
            onPressed: () => ref.invalidate(conversationsProvider(filters)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: InputDecoration(labelText: l10n.status),
              items: [
                DropdownMenuItem(value: null, child: Text(l10n.all)),
                DropdownMenuItem(value: 'OPEN', child: Text(l10n.open)),
                DropdownMenuItem(value: 'CLOSED', child: Text(l10n.closed)),
                DropdownMenuItem(value: 'ARCHIVED', child: Text(l10n.archived)),
              ],
              onChanged: (value) => setState(() => _status = value),
            ),
          ),
          Expanded(
            child: conversations.when(
              data: (items) {
                if (items.isEmpty) {
                  return EmptyState(
                    title: l10n.noConversations,
                    message: l10n.conversationsAppearHere,
                    icon: Icons.forum_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.refresh(conversationsProvider(filters).future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) =>
                        ConversationCard(conversation: items[index]),
                  ),
                );
              },
              error: (error, _) => EmptyState(
                title: l10n.conversationsUnavailable,
                message: context.formatApiError(error),
                icon: Icons.cloud_off_outlined,
                action: OutlinedButton.icon(
                  onPressed: () =>
                      ref.invalidate(conversationsProvider(filters)),
                  icon: const Icon(Icons.refresh),
                  label: Text(l10n.retry),
                ),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}

class ConversationCard extends StatelessWidget {
  const ConversationCard({super.key, required this.conversation});

  final Conversation conversation;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/crm-conversations/${conversation.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      conversation.project?.name ??
                          conversation.crmLead?.project?.name ??
                          l10n.crmConversation,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(conversation.crmLead?.client?.name ?? conversation.type),
              const SizedBox(height: 4),
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
                    Chip(label: Text(l10n.shareLink)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
