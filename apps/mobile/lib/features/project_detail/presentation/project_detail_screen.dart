import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../features/marketplace/data/marketplace_repository.dart';
import '../../../features/marketplace/presentation/image_carousel_placeholder.dart';
import '../../../features/marketplace/presentation/payment_plans_section.dart';
import '../../../features/marketplace/presentation/units_list_screen.dart';
import '../../../shared/widgets/empty_state.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectDetailProvider(projectId));
    final units = ref.watch(projectUnitsProvider(projectId));

    return Scaffold(
      appBar: AppBar(title: const Text('Project')),
      body: project.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ProjectHeader(project: item),
            const SizedBox(height: 18),
            Text('Images', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ImageCarouselPlaceholder(imageUrl: item.coverImageUrl),
            const SizedBox(height: 18),
            Text('Payment plans', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            PaymentPlansSection(paymentPlans: item.paymentPlans),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () => context.push(
                '/lead-claims/new?projectId=${Uri.encodeComponent(item.id)}',
              ),
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text('Create Lead Claim'),
            ),
            const SizedBox(height: 18),
            Text('Available units', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            units.when(
              data: (unitItems) {
                if (unitItems.isEmpty) {
                  return const EmptyState(
                    title: 'No units visible',
                    message: 'The backend did not expose units for this project.',
                  );
                }
                return Column(
                  children: [
                    for (final unit in unitItems) ...[
                      UnitCard(unit: unit),
                      const SizedBox(height: 12),
                    ],
                  ],
                );
              },
              error: (error, _) => EmptyState(
                title: 'Units unavailable',
                message: apiErrorMessage(error),
                icon: Icons.cloud_off_outlined,
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: 'Project unavailable',
          message: apiErrorMessage(error),
                icon: Icons.lock_outline,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(projectDetailProvider(projectId)),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _ProjectHeader extends StatelessWidget {
  const _ProjectHeader({required this.project});

  final MarketplaceProject project;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(project.name, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              project.locationLabel,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (project.developerName != null) ...[
              const SizedBox(height: 8),
              Text('Developer: ${project.developerName}'),
            ],
            if (project.description != null && project.description!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(project.description!),
            ],
            const SizedBox(height: 16),
            Text(project.startingPriceLabel, style: theme.textTheme.titleLarge),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _DetailChip(label: project.status),
                if (project.type != null) _DetailChip(label: project.type!),
                if (project.latitude != null && project.longitude != null)
                  _DetailChip(
                    label:
                        '${project.latitude!.toStringAsFixed(4)}, ${project.longitude!.toStringAsFixed(4)}',
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  const _DetailChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(label: Text(label));
  }
}
