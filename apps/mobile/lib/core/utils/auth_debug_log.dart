import 'package:flutter/foundation.dart';

void authDebugLog(String message) {
  if (kDebugMode) {
    debugPrint('[auth] $message');
  }
}
