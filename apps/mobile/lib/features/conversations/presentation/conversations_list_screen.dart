import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
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

class _ConversationsListScreenState extends ConsumerState<ConversationsListScreen> {
  String? _status;

  @override
  Widget build(BuildContext context) {
    final filters = ConversationFilters(status: _status);
    final conversations = ref.watch(conversationsProvider(filters));

    return Scaffold(
      appBar: AppBar(
        title: const Text('CRM conversations'),
        actions: [
          IconButton(
            tooltip: 'Refresh conversations',
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
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: null, child: Text('All')),
                DropdownMenuItem(value: 'OPEN', child: Text('Open')),
                DropdownMenuItem(value: 'CLOSED', child: Text('Closed')),
                DropdownMenuItem(value: 'ARCHIVED', child: Text('Archived')),
              ],
              onChanged: (value) => setState(() => _status = value),
            ),
          ),
          Expanded(
            child: conversations.when(
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyState(
                    title: 'No conversations',
                    message: 'CRM conversations in your scope appear here.',
                    icon: Icons.forum_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.refresh(conversationsProvider(filters).future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) =>
                        ConversationCard(conversation: items[index]),
                  ),
                );
              },
              error: (error, _) => EmptyState(
                title: 'Conversations unavailable',
                message: apiErrorMessage(error),
                icon: Icons.cloud_off_outlined,
                action: OutlinedButton.icon(
                  onPressed: () => ref.invalidate(conversationsProvider(filters)),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
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
                          'CRM conversation',
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(conversation.crmLead?.client?.name ?? conversation.type),
              const SizedBox(height: 4),
              Text('Updated ${shortDateTime(conversation.updatedAt)}'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: conversation.status),
                  Chip(label: Text(conversation.type)),
                  if (conversation.shareToken != null)
                    const Chip(label: Text('Share link')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
