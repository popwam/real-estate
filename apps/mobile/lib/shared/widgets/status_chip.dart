import 'package:flutter/material.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final normalized = label.toUpperCase();
    final color = switch (normalized) {
      'ACTIVE' || 'APPROVED' || 'AVAILABLE' => Colors.green,
      'PENDING' => Colors.orange,
      'REJECTED' || 'EXPIRED' || 'CANCELLED' => Colors.red,
      'RELEASED' => Colors.blueGrey,
      _ => theme.colorScheme.primary,
    };

    return Chip(
      label: Text(label),
      visualDensity: VisualDensity.compact,
      backgroundColor: color.withValues(alpha: 0.12),
      side: BorderSide(color: color.withValues(alpha: 0.25)),
      labelStyle: TextStyle(color: color),
    );
  }
}
