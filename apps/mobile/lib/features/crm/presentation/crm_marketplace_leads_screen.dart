import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/crm_models.dart';
import '../data/crm_repository.dart';
import 'crm_leads_list_screen.dart';

class CrmMarketplaceLeadsScreen extends ConsumerStatefulWidget {
  const CrmMarketplaceLeadsScreen({super.key});

  @override
  ConsumerState<CrmMarketplaceLeadsScreen> createState() =>
      _CrmMarketplaceLeadsScreenState();
}

class _CrmMarketplaceLeadsScreenState
    extends ConsumerState<CrmMarketplaceLeadsScreen> {
  String? _status;
  String? _method;
  String? _message;
  bool _claiming = false;

  @override
  Widget build(BuildContext context) {
    final filters = CrmLeadFilters(
      status: _status,
      preferredContactMethod: _method,
    );
    final leads = ref.watch(marketplaceCrmLeadsProvider(filters));
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.marketplaceCrmLeads),
        actions: [
          IconButton(
            tooltip: l10n.refreshMarketplaceCrmLeads,
            onPressed: () =>
                ref.invalidate(marketplaceCrmLeadsProvider(filters)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_message != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: MaterialBanner(
                content: Text(_message!),
                actions: [
                  TextButton(
                    onPressed: () => setState(() => _message = null),
                    child: Text(l10n.dismiss),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _status,
                    decoration: InputDecoration(labelText: l10n.status),
                    items: [
                      DropdownMenuItem(value: null, child: Text(l10n.all)),
                      DropdownMenuItem(
                        value: 'NEW',
                        child: Text(l10n.newStatus),
                      ),
                      DropdownMenuItem(
                        value: 'CLAIMED',
                        child: Text(l10n.claimed),
                      ),
                      DropdownMenuItem(
                        value: 'IN_CONVERSATION',
                        child: Text(l10n.inChat),
                      ),
                    ],
                    onChanged: (value) => setState(() => _status = value),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _method,
                    decoration: InputDecoration(labelText: l10n.contact),
                    items: [
                      DropdownMenuItem(value: null, child: Text(l10n.all)),
                      DropdownMenuItem(value: 'CALL', child: Text(l10n.call)),
                      DropdownMenuItem(value: 'CHAT', child: Text(l10n.chat)),
                      DropdownMenuItem(
                        value: 'WHATSAPP',
                        child: Text(l10n.whatsApp),
                      ),
                    ],
                    onChanged: (value) => setState(() => _method = value),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: leads.when(
              data: (items) {
                if (items.isEmpty) {
                  return EmptyState(
                    title: l10n.noMarketplaceCrmLeads,
                    message: l10n.marketplaceCrmLeadsAppearHere,
                    icon: Icons.person_add_alt_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.refresh(marketplaceCrmLeadsProvider(filters).future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final lead = items[index];
                      return CrmLeadCard(
                        lead: lead,
                        trailing: lead.unavailable || lead.isClaimed
                            ? const Icon(Icons.lock_outline)
                            : FilledButton(
                                onPressed: _claiming
                                    ? null
                                    : () => _claimLead(lead, filters),
                                child: Text(l10n.claim),
                              ),
                      );
                    },
                  ),
                );
              },
              error: (error, _) => EmptyState(
                title: l10n.marketplaceCrmLeadsUnavailable,
                message: context.formatApiError(error),
                icon: Icons.cloud_off_outlined,
                action: OutlinedButton.icon(
                  onPressed: () =>
                      ref.invalidate(marketplaceCrmLeadsProvider(filters)),
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

  Future<void> _claimLead(CrmLead lead, CrmLeadFilters filters) async {
    setState(() {
      _claiming = true;
      _message = null;
    });
    try {
      await ref.read(crmRepositoryProvider).claim(lead.id);
      ref.invalidate(marketplaceCrmLeadsProvider(filters));
      ref.invalidate(crmLeadsProvider(const CrmLeadFilters()));
      setState(() => _message = context.l10n.leadClaimed);
    } on DioException catch (error) {
      setState(() {
        _message = error.response?.statusCode == 409
            ? context.l10n.leadAlreadyClaimed
            : context.formatApiError(error);
      });
    } finally {
      if (mounted) {
        setState(() => _claiming = false);
      }
    }
  }
}
