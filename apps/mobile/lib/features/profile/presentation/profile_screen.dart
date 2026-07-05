import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../core/router/auth_route_policy.dart';
import '../../../shared/widgets/language_selector.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../crm/presentation/crm_summary_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider).state;
    final session = auth.session;
    final l10n = context.l10n;

    if (!auth.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.profile)),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      l10n.guestMarketplaceTitle,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(l10n.guestMarketplaceMessage),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: () => context.push('/login'),
                      icon: const Icon(Icons.login),
                      label: Text(l10n.signIn),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => context.go(publicHomeRoute),
                      icon: const Icon(Icons.apartment_outlined),
                      label: Text(l10n.continueBrowsing),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      l10n.settings,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    const LanguageSelector(),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profile)),
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
                    session?.user.displayName ?? l10n.signedIn,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(session?.user.email ?? ''),
                  const SizedBox(height: 16),
                  _ProfileRow(
                    label: l10n.role,
                    value: session?.user.role ?? '-',
                  ),
                  _ProfileRow(
                    label: l10n.organization,
                    value: session?.organization?.name ?? '-',
                  ),
                  _ProfileRow(
                    label: l10n.status,
                    value: session?.organization?.status ?? '-',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    l10n.settings,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  const LanguageSelector(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (session != null &&
              canAccessWorkspaceFeature(session, MobileWorkspaceFeature.crm)) ...[
            const CrmSummaryCard(),
            const SizedBox(height: 16),
            _ProfileAction(
              route: '/crm-leads',
              icon: Icons.people_alt_outlined,
              label: l10n.crmLeads,
            ),
            _ProfileAction(
              route: '/crm-marketplace-leads',
              icon: Icons.person_add_alt_outlined,
              label: l10n.marketplaceCrmLeads,
            ),
          ],
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.conversations,
              ))
            _ProfileAction(
              route: '/crm-conversations',
              icon: Icons.chat_bubble_outline,
              label: l10n.crmConversations,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.brokerProfile,
              ))
            _ProfileAction(
              route: '/broker-profile',
              icon: Icons.badge_outlined,
              label: l10n.brokerProfile,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.leadClaims,
              ))
            _ProfileAction(
              route: '/lead-claims',
              icon: Icons.person_search_outlined,
              label: l10n.myLeadClaims,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.reservations,
              ))
            _ProfileAction(
              route: '/reservation-requests',
              icon: Icons.event_note_outlined,
              label: l10n.reservationRequests,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.dealRooms,
              ))
            _ProfileAction(
              route: '/deal-rooms',
              icon: Icons.forum_outlined,
              label: l10n.dealRooms,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(session, MobileWorkspaceFeature.deals))
            _ProfileAction(
              route: '/deals',
              icon: Icons.receipt_long_outlined,
              label: l10n.myDeals,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.commissions,
              ))
            _ProfileAction(
              route: '/commissions',
              icon: Icons.payments_outlined,
              label: l10n.myCommissions,
            ),
          if (session != null &&
              canAccessWorkspaceFeature(
                session,
                MobileWorkspaceFeature.attendance,
              ))
            _ProfileAction(
              route: '/attendance',
              icon: Icons.event_available_outlined,
              label: l10n.attendance,
            ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () async {
              await ref.read(authControllerProvider).logout();
              if (context.mounted) {
                context.go(publicHomeRoute);
              }
            },
            icon: const Icon(Icons.logout),
            label: Text(l10n.logout),
          ),
        ],
      ),
    );
  }
}

class _ProfileAction extends StatelessWidget {
  const _ProfileAction({
    required this.route,
    required this.icon,
    required this.label,
  });

  final String route;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: OutlinedButton.icon(
        onPressed: () => context.push(route),
        icon: Icon(icon),
        label: Text(label),
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
