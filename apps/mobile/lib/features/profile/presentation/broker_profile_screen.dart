import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../shared/widgets/empty_state.dart';
import '../data/broker_profile_models.dart';
import '../data/broker_profile_repository.dart';

class BrokerProfileScreen extends ConsumerWidget {
  const BrokerProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(brokerProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Broker profile'),
        actions: [
          IconButton(
            tooltip: 'Edit placeholder',
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
          title: 'Broker profile unavailable',
          message:
              '${apiErrorMessage(error)}\n\nThis screen is ready for GET /broker-profile/me when the backend exposes it.',
          icon: Icons.badge_outlined,
          action: OutlinedButton.icon(
            onPressed: () => ref.invalidate(brokerProfileProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
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
      appBar: AppBar(title: const Text('Edit broker profile')),
      body: const EmptyState(
        title: 'Edit profile is not active yet',
        message: 'Profile update APIs are not part of the current backend slice.',
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              profile.displayName ?? 'Broker profile',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _ProfileRow(label: 'License', value: profile.licenseNumber ?? '-'),
            _ProfileRow(label: 'Phone', value: profile.phone ?? '-'),
            _ProfileRow(label: 'Country', value: profile.country ?? '-'),
            _ProfileRow(label: 'City', value: profile.city ?? '-'),
            _ProfileRow(label: 'Status', value: profile.status ?? '-'),
            _ProfileRow(
              label: 'Experience',
              value: profile.yearsOfExperience == null
                  ? '-'
                  : '${profile.yearsOfExperience} years',
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
