import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/storage/secure_token_storage.dart';

class AttendanceDeviceIntegrity {
  const AttendanceDeviceIntegrity({
    required this.deviceId,
    this.developerOptionsEnabled,
    this.usbDebuggingEnabled,
    this.supported = true,
  });

  final String deviceId;
  final bool? developerOptionsEnabled;
  final bool? usbDebuggingEnabled;
  final bool supported;
}

class AttendanceDeviceIntegrityService {
  AttendanceDeviceIntegrityService(this._storage);

  static const _channel = MethodChannel(
    'com.popwam.realestate.mobile/device_integrity',
  );

  final SecureTokenStorage _storage;

  Future<AttendanceDeviceIntegrity> collect() async {
    final deviceId = await _deviceId();
    if (!Platform.isAndroid) {
      return AttendanceDeviceIntegrity(
        deviceId: deviceId,
        developerOptionsEnabled: null,
        usbDebuggingEnabled: null,
        supported: false,
      );
    }

    final result = await _channel.invokeMapMethod<String, dynamic>(
      'readAndroidDebugSettings',
    );
    if (result == null || result['supported'] != true) {
      return AttendanceDeviceIntegrity(
        deviceId: deviceId,
        developerOptionsEnabled: null,
        usbDebuggingEnabled: null,
        supported: false,
      );
    }

    return AttendanceDeviceIntegrity(
      deviceId: deviceId,
      developerOptionsEnabled: result['developerOptionsEnabled'] == true,
      usbDebuggingEnabled: result['usbDebuggingEnabled'] == true,
    );
  }

  Future<String> _deviceId() async {
    final existing = await _storage.readDeviceId();
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }
    final created = const Uuid().v4();
    await _storage.saveDeviceId(created);
    return created;
  }
}

final attendanceDeviceIntegrityServiceProvider =
    Provider<AttendanceDeviceIntegrityService>((ref) {
      return AttendanceDeviceIntegrityService(
        ref.watch(secureTokenStorageProvider),
      );
    });
