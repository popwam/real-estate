import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/marketplace_filters.dart';
import '../data/marketplace_models.dart';
import '../data/marketplace_repository.dart';
import 'marketplace_filters_sheet.dart';
import 'projects_list_screen.dart';

final mapSearchProvider =
    FutureProvider.autoDispose<List<MarketplaceProject>>((ref) {
  final filters = ref.watch(marketplaceFiltersProvider);
  return ref.watch(marketplaceRepositoryProvider).mapSearch(
        minLat: -90,
        maxLat: 90,
        minLng: -180,
        maxLng: 180,
        filters: filters,
      );
});

class MapSearchScreen extends ConsumerWidget {
  const MapSearchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final results = ref.watch(mapSearchProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Map search'),
        actions: [
          const MarketplaceFiltersButton(),
          IconButton(
            tooltip: 'Refresh map search',
            onPressed: () => ref.invalidate(mapSearchProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(Icons.map_outlined),
                SizedBox(width: 12),
                Expanded(
                  child: Text('Map UI placeholder using backend bbox search.'),
                ),
              ],
            ),
          ),
          Expanded(
            child: results.when(
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyState(
                    title: 'No map results',
                    message: 'Visible projects inside the bbox will appear here.',
                    icon: Icons.map_outlined,
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: items.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => ProjectCard(project: items[index]),
                );
              },
              error: (error, _) => EmptyState(
                title: 'Map search unavailable',
                message: apiErrorMessage(error),
                icon: Icons.cloud_off_outlined,
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}
