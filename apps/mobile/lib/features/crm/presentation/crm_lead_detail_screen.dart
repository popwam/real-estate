import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/crm_repository.dart';

class CrmLeadDetailScreen extends ConsumerStatefulWidget {
  const CrmLeadDetailScreen({super.key, required this.leadId});

  final String leadId;

  @override
  ConsumerState<CrmLeadDetailScreen> createState() =>
      _CrmLeadDetailScreenState();
}

class _CrmLeadDetailScreenState extends ConsumerState<CrmLeadDetailScreen> {
  String? _message;
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final lead = ref.watch(crmLeadDetailProvider(widget.leadId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('CRM lead'),
        actions: [
          IconButton(
            tooltip: 'Refresh lead',
            onPressed: () => ref.invalidate(crmLeadDetailProvider(widget.leadId)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: lead.when(
        data: (item) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_message != null)
                MaterialBanner(
                  content: Text(_message!),
                  actions: [
                    TextButton(
                      onPressed: () => setState(() => _message = null),
                      child: const Text('Dismiss'),
                    ),
                  ],
                ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.client?.name ?? 'Masked lead',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      if (item.client?.phoneLast4 != null)
                        Text('Phone ending ${item.client!.phoneLast4}'),
                      if (item.client?.email != null) Text(item.client!.email!),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          StatusChip(label: item.status),
                          Chip(label: Text(item.preferredContactMethod)),
                          Chip(label: Text(item.isClaimed ? 'Claimed' : 'Unclaimed')),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _InfoCard(
                title: 'Project',
                rows: [
                  _InfoRow('Project', item.project?.name ?? '-'),
                  _InfoRow('Source page', item.sourcePage ?? '-'),
                  _InfoRow('Created', shortDateTime(item.createdAt)),
                  _InfoRow('Claimed', shortDateTime(item.claimedAt)),
                  _InfoRow('Claim organization', item.claimedByOrganization?.name ?? '-'),
                  _InfoRow('Status note', item.statusNote ?? '-'),
                ],
              ),
              if (item.utm != null) ...[
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'UTM',
                  rows: item.utm!.entries
                      .map((entry) => _InfoRow(entry.key, entry.value.toString()))
                      .toList(),
                ),
              ],
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Actions',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed:
                            _busy ? null : () => _createConversation(widget.leadId),
                        icon: const Icon(Icons.forum_outlined),
                        label: const Text('Open conversation'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _busy ? null : () => _claimLead(widget.leadId),
                        icon: const Icon(Icons.person_add_alt_outlined),
                        label: const Text('Claim lead'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _busy
                            ? null
                            : () => _showStatusSheet(
                                  currentStatus: item.status,
                                ),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Update status'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        error: (error, _) => EmptyState(
          title: 'CRM lead unavailable',
          message: apiErrorMessage(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(crmLeadDetailProvider(widget.leadId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Future<void> _claimLead(String id) async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await ref.read(crmRepositoryProvider).claim(id);
      ref.invalidate(crmLeadDetailProvider(id));
      setState(() => _message = 'Lead claimed.');
    } on DioException catch (error) {
      setState(() {
        _message = error.response?.statusCode == 409
            ? 'This lead has already been claimed.'
            : apiErrorMessage(error);
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _createConversation(String id) async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final conversationId =
          await ref.read(crmRepositoryProvider).createConversationFromLead(id);
      if (conversationId.isNotEmpty && mounted) {
        context.push('/crm-conversations/$conversationId');
      }
    } catch (error) {
      setState(() => _message = apiErrorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showStatusSheet({required String currentStatus}) async {
    final result = await showModalBottomSheet<_StatusUpdate>(
      context: context,
      builder: (context) => _LeadStatusSheet(currentStatus: currentStatus),
    );
    if (result == null) return;

    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await ref.read(crmRepositoryProvider).updateStatus(
            widget.leadId,
            status: result.status,
            statusNote: result.note,
          );
      ref.invalidate(crmLeadDetailProvider(widget.leadId));
      ref.invalidate(crmSummaryProvider);
      setState(() => _message = 'Lead status updated.');
    } catch (error) {
      setState(() => _message = apiErrorMessage(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

class _LeadStatusSheet extends StatefulWidget {
  const _LeadStatusSheet({required this.currentStatus});

  final String currentStatus;

  @override
  State<_LeadStatusSheet> createState() => _LeadStatusSheetState();
}

class _LeadStatusSheetState extends State<_LeadStatusSheet> {
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
            Text('Update lead status', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'NEW', child: Text('New')),
                DropdownMenuItem(value: 'CLAIMED', child: Text('Claimed')),
                DropdownMenuItem(value: 'IN_CONVERSATION', child: Text('In chat')),
                DropdownMenuItem(value: 'QUALIFIED', child: Text('Qualified')),
                DropdownMenuItem(value: 'LOST', child: Text('Lost')),
                DropdownMenuItem(value: 'CONVERTED', child: Text('Converted')),
                DropdownMenuItem(value: 'SPAM', child: Text('Spam')),
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

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.rows});

  final String title;
  final List<_InfoRow> rows;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            for (final row in rows)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(row.label)),
                    const SizedBox(width: 12),
                    Flexible(
                      child: Text(row.value, textAlign: TextAlign.end),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;
}
