import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../features/auth/presentation/auth_controller.dart';
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
    final isSignedIn = ref.watch(authControllerProvider).state.isSignedIn;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.projectDetails)),
      body: project.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ProjectHeader(project: item),
            const SizedBox(height: 18),
            Text(l10n.images, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ImageCarouselPlaceholder(imageUrl: item.coverImageUrl),
            const SizedBox(height: 18),
            Text(
              l10n.paymentPlans,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            PaymentPlansSection(paymentPlans: item.paymentPlans),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () {
                final target =
                    '/lead-claims/new?projectId=${Uri.encodeComponent(item.id)}';
                if (!isSignedIn) {
                  context.push(
                    '/login?from=${Uri.encodeComponent(target)}',
                  );
                  return;
                }
                context.push(target);
              },
              icon: Icon(
                isSignedIn ? Icons.person_add_alt_1 : Icons.login,
              ),
              label: Text(
                isSignedIn ? l10n.createLeadClaim : l10n.signInToRequest,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              l10n.availableUnits,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            units.when(
              data: (unitItems) {
                if (unitItems.isEmpty) {
                  return EmptyState(
                    title: l10n.noUnitsVisible,
                    message: l10n.backendDidNotExposeUnits,
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
                title: l10n.unitsUnavailable,
                message: context.formatApiError(error),
                icon: Icons.cloud_off_outlined,
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ],
        ),
        error: (error, _) => EmptyState(
          title: l10n.projectUnavailable,
          message: context.formatApiError(error),
          icon: Icons.lock_outline,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(projectDetailProvider(projectId)),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
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
    final l10n = context.l10n;

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
              Text(l10n.developerLabel(project.developerName!)),
            ],
            if (project.description != null &&
                project.description!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(project.description!),
            ],
            const SizedBox(height: 16),
            Text(
              project.startingPrice == null
                  ? l10n.priceOnRequest
                  : l10n.fromPrice(
                      context.formatMoney(
                        project.startingPrice,
                        currency: project.currency,
                      ),
                    ),
              style: theme.textTheme.titleLarge,
            ),
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
