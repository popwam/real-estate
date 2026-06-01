import 'package:flutter/material.dart';

import '../data/marketplace_models.dart';

class PaymentPlansSection extends StatelessWidget {
  const PaymentPlansSection({super.key, required this.paymentPlans});

  final List<MarketplacePaymentPlan> paymentPlans;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (paymentPlans.isEmpty) {
      return Text(
        'No payment plans returned yet.',
        style: theme.textTheme.bodyMedium?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }

    return Column(
      children: [
        for (final plan in paymentPlans) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border.all(color: theme.colorScheme.outlineVariant),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(plan.label, style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (plan.downPaymentPercent != null)
                      Chip(
                        label: Text(
                          '${plan.downPaymentPercent!.toStringAsFixed(0)}% down',
                        ),
                      ),
                    if (plan.installments != null)
                      Chip(label: Text('${plan.installments} installments')),
                    if (plan.years != null) Chip(label: Text('${plan.years} years')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}
