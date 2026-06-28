import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
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
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.crmLeads),
        actions: [
          IconButton(
            tooltip: l10n.refreshCrmLeads,
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
                  return EmptyState(
                    title: l10n.noCrmLeads,
                    message: l10n.crmLeadsAppearHere,
                    icon: Icons.people_alt_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.refresh(crmLeadsProvider(filters).future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return CrmLeadCard(lead: items[index]);
                    },
                  ),
                );
              },
              error: (error, _) => EmptyState(
                title: l10n.crmLeadsUnavailable,
                message: context.formatApiError(error),
                icon: Icons.cloud_off_outlined,
                action: OutlinedButton.icon(
                  onPressed: () => ref.invalidate(crmLeadsProvider(filters)),
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

class CrmLeadCard extends StatelessWidget {
  const CrmLeadCard({super.key, required this.lead, this.trailing});

  final CrmLead lead;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final clientName = lead.client?.name ?? l10n.maskedLead;
    final phone = lead.client?.phoneLast4 == null
        ? null
        : l10n.phoneEnding(lead.client!.phoneLast4!);

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
                  trailing ?? const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(lead.project?.name ?? l10n.noProjectAttached),
              if (phone != null) ...[const SizedBox(height: 4), Text(phone)],
              const SizedBox(height: 4),
              Text(l10n.createdAt(context.formatShortDateTime(lead.createdAt))),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusChip(label: lead.status),
                  Chip(label: Text(lead.preferredContactMethod)),
                  Chip(
                    label: Text(lead.isClaimed ? l10n.claimed : l10n.unclaimed),
                  ),
                  if (lead.unavailable) Chip(label: Text(l10n.unavailable)),
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
    final l10n = context.l10n;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              initialValue: status,
              decoration: InputDecoration(labelText: l10n.status),
              items: [
                DropdownMenuItem(value: null, child: Text(l10n.all)),
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
              onChanged: onStatusChanged,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              initialValue: method,
              decoration: InputDecoration(labelText: l10n.contact),
              items: [
                DropdownMenuItem(value: null, child: Text(l10n.all)),
                DropdownMenuItem(value: 'CALL', child: Text(l10n.call)),
                DropdownMenuItem(value: 'CHAT', child: Text(l10n.chat)),
                DropdownMenuItem(value: 'WHATSAPP', child: Text(l10n.whatsApp)),
              ],
              onChanged: onMethodChanged,
            ),
          ),
        ],
      ),
    );
  }
}
