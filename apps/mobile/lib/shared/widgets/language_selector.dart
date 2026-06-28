import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/l10n_extensions.dart';
import '../../core/localization/locale_controller.dart';

class LanguageSelector extends ConsumerWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeControllerProvider);

    return DropdownButtonFormField<Locale>(
      key: ValueKey(locale.languageCode),
      initialValue: locale,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: context.l10n.language,
        prefixIcon: const Icon(Icons.language),
      ),
      items: [
        for (final option in supportedMobileLocales)
          DropdownMenuItem(
            value: option,
            child: Text(_labelFor(context, option)),
          ),
      ],
      onChanged: (next) {
        if (next != null) {
          ref.read(localeControllerProvider.notifier).setLocale(next);
        }
      },
    );
  }

  String _labelFor(BuildContext context, Locale locale) {
    return switch (locale.languageCode) {
      'ar' => context.l10n.arabic,
      'fr' => context.l10n.french,
      _ => context.l10n.english,
    };
  }
}
