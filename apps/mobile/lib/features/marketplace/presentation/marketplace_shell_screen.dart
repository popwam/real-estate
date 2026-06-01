import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

export 'projects_list_screen.dart';
export 'units_list_screen.dart';

class MarketplaceShellScreen extends StatelessWidget {
  const MarketplaceShellScreen({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
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
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment),
            label: 'Projects',
          ),
          NavigationDestination(
            icon: Icon(Icons.home_work_outlined),
            selectedIcon: Icon(Icons.home_work),
            label: 'Units',
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map),
            label: 'Map',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
