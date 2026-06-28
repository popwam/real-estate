import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/broker_profile_models.dart';
import '../data/broker_profile_repository.dart';

class BrokerProfileScreen extends ConsumerWidget {
  const BrokerProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(brokerProfileProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.brokerProfile),
        actions: [
          IconButton(
            tooltip: l10n.editPlaceholder,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const BrokerProfileEditPlaceholderScreen(),
              ),
            ),
            icon: const Icon(Icons.edit_outlined),
          ),
        ],
      ),
      body: profile.when(
        data: (item) => ListView(
          padding: const EdgeInsets.all(16),
          children: [_BrokerProfileCard(profile: item)],
        ),
        error: (error, _) => EmptyState(
          title: l10n.brokerProfileUnavailable,
          message:
              '${context.formatApiError(error)}\n\n${l10n.brokerProfileBackendReady}',
          icon: Icons.badge_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(brokerProfileProvider),
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retry),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class BrokerProfileEditPlaceholderScreen extends StatelessWidget {
  const BrokerProfileEditPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.editBrokerProfile)),
      body: EmptyState(
        title: context.l10n.editProfileInactive,
        message: context.l10n.profileUpdateApisUnavailable,
        icon: Icons.edit_note_outlined,
      ),
    );
  }
}

class _BrokerProfileCard extends StatelessWidget {
  const _BrokerProfileCard({required this.profile});

  final BrokerProfile profile;

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
            Text(
              profile.displayName ?? l10n.brokerProfile,
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _ProfileRow(
              label: l10n.license,
              value: profile.licenseNumber ?? '-',
            ),
            _ProfileRow(label: l10n.phone, value: profile.phone ?? '-'),
            _ProfileRow(label: l10n.country, value: profile.country ?? '-'),
            _ProfileRow(label: l10n.city, value: profile.city ?? '-'),
            _ProfileRow(label: l10n.status, value: profile.status ?? '-'),
            _ProfileRow(
              label: l10n.experience,
              value: profile.yearsOfExperience == null
                  ? '-'
                  : l10n.yearsExperience(profile.yearsOfExperience!),
            ),
          ],
        ),
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
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Flexible(child: Text(value, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
