import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/crm_models.dart';
import '../data/crm_repository.dart';

class CrmLeadsListScreen extends ConsumerStatefulWidget {
  const CrmLeadsListScreen({super.key});

  @override
  ConsumerState<CrmLeadsListScreen> createState() => _CrmLeadsListScreenState();
}

class _CrmLeadsListScreenState extends ConsumerState<CrmLeadsListScreen> {
  String? _status;
  String? _method;

  @override
  Widget build(BuildContext context) {
    final filters = CrmLeadFilters(
      status: _status,
      preferredContactMethod: _method,
    );
    final leads = ref.watch(crmLeadsProvider(filters));

    return Scaffold(
      appBar: AppBar(
        title: const Text('CRM leads'),
        actions: [
          IconButton(
            tooltip: 'Refresh CRM leads',
            onPressed: () => ref.invalidate(crmLeadsProvider(filters)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          _LeadFilters(
            status: _status,
            method: _method,
            onStatusChanged: (value) => setState(() => _status = value),
            onMethodChanged: (value) => setState(() => _method = value),
          ),
          Expanded(
            child: leads.when(
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyState(
                    title: 'No CRM leads',
                    message: 'Public and claimed CRM leads in your scope appear here.',
                    icon: Icons.people_alt_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(crmLeadsProvider(filters).future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return CrmLeadCard(lead: items[index]);
                    },
                  ),
                );
              },
              error: (error, _) => EmptyState(
                title: 'CRM leads unavailable',
                message: apiErrorMessage(error),
                icon: Icons.cloud_off_outlined,
                action: OutlinedButton.icon(
                  onPressed: () => ref.invalidate(crmLeadsProvider(filters)),
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

class CrmLeadCard extends StatelessWidget {
  const CrmLeadCard({super.key, required this.lead, this.trailing});

  final CrmLead lead;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final clientName = lead.client?.name ?? 'Masked lead';
    final phone = lead.client?.phoneLast4 == null
        ? null
        : 'Phone ending ${lead.client!.phoneLast4}';

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/crm-leads/${lead.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(clientName, style: theme.textTheme.titleMedium),
                  ),
                  trailing ?? const Icon(Icons.chevron_right),
                ],
              ),
              const SizedBox(height: 8),
              Text(lead.project?.name ?? 'No project attached'),
              if (phone != null) ...[
                const SizedBox(height: 4),
                Text(phone),
              ],
              const SizedBox(height: 4),
              Text('Created ${shortDateTime(lead.createdAt)}'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: lead.status),
                  Chip(label: Text(lead.preferredContactMethod)),
                  Chip(label: Text(lead.isClaimed ? 'Claimed' : 'Unclaimed')),
                  if (lead.unavailable) const Chip(label: Text('Unavailable')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LeadFilters extends StatelessWidget {
  const _LeadFilters({
    required this.status,
    required this.method,
    required this.onStatusChanged,
    required this.onMethodChanged,
  });

  final String? status;
  final String? method;
  final ValueChanged<String?> onStatusChanged;
  final ValueChanged<String?> onMethodChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              initialValue: status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: null, child: Text('All')),
                DropdownMenuItem(value: 'NEW', child: Text('New')),
                DropdownMenuItem(value: 'CLAIMED', child: Text('Claimed')),
                DropdownMenuItem(value: 'IN_CONVERSATION', child: Text('In chat')),
                DropdownMenuItem(value: 'QUALIFIED', child: Text('Qualified')),
                DropdownMenuItem(value: 'LOST', child: Text('Lost')),
                DropdownMenuItem(value: 'CONVERTED', child: Text('Converted')),
                DropdownMenuItem(value: 'SPAM', child: Text('Spam')),
              ],
              onChanged: onStatusChanged,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              initialValue: method,
              decoration: const InputDecoration(labelText: 'Contact'),
              items: const [
                DropdownMenuItem(value: null, child: Text('All')),
                DropdownMenuItem(value: 'CALL', child: Text('Call')),
                DropdownMenuItem(value: 'CHAT', child: Text('Chat')),
                DropdownMenuItem(value: 'WHATSAPP', child: Text('WhatsApp')),
              ],
              onChanged: onMethodChanged,
            ),
          ),
        ],
      ),
    );
  }
}
