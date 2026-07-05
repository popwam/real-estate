import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';

export 'projects_list_screen.dart';
export 'units_list_screen.dart';

class MarketplaceShellScreen extends StatelessWidget {
  const MarketplaceShellScreen({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final l10n = context.l10n;
    final selectedIndex = switch (location) {
      '/marketplace/units' => 1,
      '/marketplace/map' => 2,
      '/profile' => 3,
      '/broker-profile' => 3,
      '/lead-claims' => 3,
      '/reservation-requests' => 3,
      '/deal-rooms' => 3,
      '/deals' => 3,
      '/commissions' => 3,
      '/attendance' => 3,
      '/crm-leads' => 3,
      '/crm-marketplace-leads' => 3,
      '/crm-conversations' => 3,
      _ => 0,
    };

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) {
          final nextLocation = switch (index) {
            1 => '/marketplace/units',
            2 => '/marketplace/map',
            3 => '/profile',
            _ => '/marketplace/projects',
          };
          context.go(nextLocation);
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.apartment_outlined),
            selectedIcon: const Icon(Icons.apartment),
            label: l10n.projects,
          ),
          NavigationDestination(
            icon: const Icon(Icons.home_work_outlined),
            selectedIcon: const Icon(Icons.home_work),
            label: l10n.units,
          ),
          NavigationDestination(
            icon: const Icon(Icons.map_outlined),
            selectedIcon: const Icon(Icons.map),
            label: l10n.map,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l10n.profile,
          ),
        ],
      ),
    );
  }
}
