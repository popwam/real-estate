import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_token_storage.dart';

const supportedMobileLocales = <Locale>[
  Locale('en'),
  Locale('ar'),
  Locale('fr'),
];

class LocaleController extends Notifier<Locale> {
  late final SecureTokenStorage _storage;
  bool _hasManualSelection = false;

  @override
  Locale build() {
    _storage = ref.watch(secureTokenStorageProvider);
    restore();
    return const Locale('en');
  }

  Future<void> restore() async {
    final storedCode = await _storage.readLocaleCode();
    if (_hasManualSelection) {
      return;
    }
    final restored = normalizeMobileLocale(storedCode);
    if (restored == state) {
      return;
    }
    state = restored;
  }

  Future<void> setLocale(Locale locale) async {
    final next = normalizeMobileLocale(locale.languageCode);
    _hasManualSelection = true;
    if (next == state) {
      await _storage.saveLocaleCode(next.languageCode);
      return;
    }

    state = next;
    await _storage.saveLocaleCode(next.languageCode);
  }
}

Locale normalizeMobileLocale(String? code) {
  final languageCode = code?.split(RegExp('[-_]')).first.toLowerCase();
  for (final locale in supportedMobileLocales) {
    if (locale.languageCode == languageCode) {
      return locale;
    }
  }
  return const Locale('en');
}

final localeControllerProvider = NotifierProvider<LocaleController, Locale>(
  LocaleController.new,
);
