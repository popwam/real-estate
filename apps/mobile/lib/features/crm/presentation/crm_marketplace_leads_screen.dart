import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace CRM leads'),
        actions: [
          IconButton(
            tooltip: 'Refresh marketplace CRM leads',
            onPressed: () => ref.invalidate(marketplaceCrmLeadsProvider(filters)),
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
                    child: const Text('Dismiss'),
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
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('All')),
                      DropdownMenuItem(value: 'NEW', child: Text('New')),
                      DropdownMenuItem(value: 'CLAIMED', child: Text('Claimed')),
                      DropdownMenuItem(
                        value: 'IN_CONVERSATION',
                        child: Text('In chat'),
                      ),
                    ],
                    onChanged: (value) => setState(() => _status = value),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _method,
                    decoration: const InputDecoration(labelText: 'Contact'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('All')),
                      DropdownMenuItem(value: 'CALL', child: Text('Call')),
                      DropdownMenuItem(value: 'CHAT', child: Text('Chat')),
                      DropdownMenuItem(value: 'WHATSAPP', child: Text('WhatsApp')),
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
                  return const EmptyState(
                    title: 'No marketplace CRM leads',
                    message: 'Claimable CRM leads appear here when available.',
                    icon: Icons.person_add_alt_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.refresh(marketplaceCrmLeadsProvider(filters).future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
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
                                child: const Text('Claim'),
                              ),
                      );
                    },
                  ),
                );
              },
              error: (error, _) => EmptyState(
                title: 'Marketplace CRM leads unavailable',
                message: apiErrorMessage(error),
                icon: Icons.cloud_off_outlined,
                action: OutlinedButton.icon(
                  onPressed: () =>
                      ref.invalidate(marketplaceCrmLeadsProvider(filters)),
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

  Future<void> _claimLead(CrmLead lead, CrmLeadFilters filters) async {
    setState(() {
      _claiming = true;
      _message = null;
    });
    try {
      await ref.read(crmRepositoryProvider).claim(lead.id);
      ref.invalidate(marketplaceCrmLeadsProvider(filters));
      ref.invalidate(crmLeadsProvider(const CrmLeadFilters()));
      setState(() => _message = 'Lead claimed.');
    } on DioException catch (error) {
      setState(() {
        _message = error.response?.statusCode == 409
            ? 'This lead has already been claimed.'
            : apiErrorMessage(error);
      });
    } finally {
      if (mounted) {
        setState(() => _claiming = false);
      }
    }
  }
}
