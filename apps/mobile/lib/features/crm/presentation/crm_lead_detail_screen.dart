import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
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
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.crmLead),
        actions: [
          IconButton(
            tooltip: l10n.refreshLead,
            onPressed: () =>
                ref.invalidate(crmLeadDetailProvider(widget.leadId)),
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
                      child: Text(l10n.dismiss),
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
                        item.client?.name ?? l10n.maskedLead,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      if (item.client?.phoneLast4 != null)
                        Text(l10n.phoneEnding(item.client!.phoneLast4!)),
                      if (item.client?.email != null) Text(item.client!.email!),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          StatusChip(label: item.status),
                          Chip(label: Text(item.preferredContactMethod)),
                          Chip(
                            label: Text(
                              item.isClaimed ? l10n.claimed : l10n.unclaimed,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _InfoCard(
                title: l10n.projectLabel,
                rows: [
                  _InfoRow(l10n.projectLabel, item.project?.name ?? '-'),
                  _InfoRow(l10n.sourcePage, item.sourcePage ?? '-'),
                  _InfoRow(
                    l10n.created,
                    context.formatShortDateTime(item.createdAt),
                  ),
                  _InfoRow(
                    l10n.claimedLabel,
                    context.formatShortDateTime(item.claimedAt),
                  ),
                  _InfoRow(
                    l10n.claimOrganization,
                    item.claimedByOrganization?.name ?? '-',
                  ),
                  _InfoRow(l10n.statusNote, item.statusNote ?? '-'),
                ],
              ),
              if (item.utm != null) ...[
                const SizedBox(height: 12),
                _InfoCard(
                  title: l10n.utm,
                  rows: item.utm!.entries
                      .map(
                        (entry) => _InfoRow(entry.key, entry.value.toString()),
                      )
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
                        l10n.actions,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: _busy
                            ? null
                            : () => _createConversation(widget.leadId),
                        icon: const Icon(Icons.forum_outlined),
                        label: Text(l10n.openConversation),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _busy
                            ? null
                            : () => _claimLead(widget.leadId),
                        icon: const Icon(Icons.person_add_alt_outlined),
                        label: Text(l10n.claimLead),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _busy
                            ? null
                            : () =>
                                  _showStatusSheet(currentStatus: item.status),
                        icon: const Icon(Icons.edit_outlined),
                        label: Text(l10n.updateStatus),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        error: (error, _) => EmptyState(
          title: l10n.crmLeadsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () =>
                ref.invalidate(crmLeadDetailProvider(widget.leadId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
      setState(() => _message = context.l10n.leadClaimed);
    } on DioException catch (error) {
      setState(() {
        _message = error.response?.statusCode == 409
            ? context.l10n.leadAlreadyClaimed
            : context.formatApiError(error);
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
      final conversationId = await ref
          .read(crmRepositoryProvider)
          .createConversationFromLead(id);
      if (conversationId.isNotEmpty && mounted) {
        context.push('/crm-conversations/$conversationId');
      }
    } catch (error) {
      setState(() => _message = context.formatApiError(error));
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
      await ref
          .read(crmRepositoryProvider)
          .updateStatus(
            widget.leadId,
            status: result.status,
            statusNote: result.note,
          );
      ref.invalidate(crmLeadDetailProvider(widget.leadId));
      ref.invalidate(crmSummaryProvider);
      setState(() => _message = context.l10n.leadStatusUpdated);
    } catch (error) {
      setState(() => _message = context.formatApiError(error));
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
    final l10n = context.l10n;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.updateLeadStatus,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: InputDecoration(labelText: l10n.status),
              items: [
                DropdownMenuItem(value: 'NEW', child: Text(l10n.newStatus)),
                DropdownMenuItem(value: 'CLAIMED', child: Text(l10n.claimed)),
                DropdownMenuItem(
                  value: 'IN_CONVERSATION',
                  child: Text(l10n.inChat),
                ),
                DropdownMenuItem(
                  value: 'QUALIFIED',
                  child: Text(l10n.qualified),
                ),
                DropdownMenuItem(value: 'LOST', child: Text(l10n.lost)),
                DropdownMenuItem(
                  value: 'CONVERTED',
                  child: Text(l10n.converted),
                ),
                DropdownMenuItem(value: 'SPAM', child: Text(l10n.spam)),
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
                    Flexible(child: Text(row.value, textAlign: TextAlign.end)),
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
