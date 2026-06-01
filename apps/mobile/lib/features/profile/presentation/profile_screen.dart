import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/presentation/auth_controller.dart';
import '../../crm/presentation/crm_summary_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider).state;
    final session = auth.session;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session?.user.displayName ?? 'Signed in',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(session?.user.email ?? ''),
                  const SizedBox(height: 16),
                  _ProfileRow(label: 'Role', value: session?.user.role ?? '-'),
                  _ProfileRow(
                    label: 'Organization',
                    value: session?.organization?.name ?? '-',
                  ),
                  _ProfileRow(
                    label: 'Status',
                    value: session?.organization?.status ?? '-',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const CrmSummaryCard(),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => context.push('/crm-leads'),
            icon: const Icon(Icons.people_alt_outlined),
            label: const Text('CRM leads'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/crm-marketplace-leads'),
            icon: const Icon(Icons.person_add_alt_outlined),
            label: const Text('Marketplace CRM leads'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/crm-conversations'),
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('CRM conversations'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/broker-profile'),
            icon: const Icon(Icons.badge_outlined),
            label: const Text('Broker profile'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/lead-claims'),
            icon: const Icon(Icons.person_search_outlined),
            label: const Text('My lead claims'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/reservation-requests'),
            icon: const Icon(Icons.event_note_outlined),
            label: const Text('Reservation requests'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/deal-rooms'),
            icon: const Icon(Icons.forum_outlined),
            label: const Text('Deal rooms'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/deals'),
            icon: const Icon(Icons.receipt_long_outlined),
            label: const Text('My deals'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.push('/commissions'),
            icon: const Icon(Icons.payments_outlined),
            label: const Text('My commissions'),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => ref.read(authControllerProvider).logout(),
            icon: const Icon(Icons.logout),
            label: const Text('Log out'),
          ),
        ],
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Flexible(child: Text(value, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
