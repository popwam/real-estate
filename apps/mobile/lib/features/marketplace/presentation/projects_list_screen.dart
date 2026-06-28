import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/directional_chevron.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/marketplace_models.dart';
import '../data/marketplace_repository.dart';
import 'marketplace_filters_sheet.dart';

class ProjectsListScreen extends ConsumerWidget {
  const ProjectsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(marketplaceProjectsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.marketplace),
        actions: [
          const MarketplaceFiltersButton(),
          IconButton(
            tooltip: l10n.refreshProjects,
            onPressed: () => ref.invalidate(marketplaceProjectsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: projects.when(
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              title: l10n.noVisibleProjects,
              message: l10n.projectsAppearHere,
              icon: Icons.apartment_outlined,
              action: const MarketplaceFiltersButton(),
            );
          }
          return RefreshIndicator(
            onRefresh: () async =>
                ref.refresh(marketplaceProjectsProvider.future),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  ProjectCard(project: items[index]),
            ),
          );
        },
        error: (error, _) => EmptyState(
          title: l10n.projectsUnavailable,
          message: context.formatApiError(error),
          icon: Icons.cloud_off_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(marketplaceProjectsProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class ProjectCard extends StatelessWidget {
  const ProjectCard({super.key, required this.project});

  final MarketplaceProject project;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.push('/marketplace/projects/${project.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (project.coverImageUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Image.network(
                      project.coverImageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const _CoverPlaceholder();
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      project.name,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  const DirectionalChevron(),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                project.locationLabel,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (project.developerName != null) ...[
                const SizedBox(height: 6),
                Text(project.developerName!, style: theme.textTheme.bodyMedium),
              ],
              const SizedBox(height: 10),
              Text(
                project.startingPrice == null
                    ? l10n.priceOnRequest
                    : l10n.fromPrice(
                        context.formatMoney(
                          project.startingPrice,
                          currency: project.currency,
                        ),
                      ),
                style: theme.textTheme.titleSmall,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (project.type != null) _InfoChip(label: project.type!),
                  _InfoChip(label: project.status),
                  if (project.visibility.isNotEmpty)
                    _InfoChip(label: project.visibility),
                  if (project.availableUnits != null)
                    _InfoChip(label: l10n.unitsCount(project.availableUnits!)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  const _CoverPlaceholder();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
      ),
      child: const Center(child: Icon(Icons.image_outlined, size: 36)),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
    );
  }
}
