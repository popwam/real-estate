import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:network_info_plus/network_info_plus.dart';

import 'attendance_evidence_models.dart';

class AttendanceWifiEvidence {
  const AttendanceWifiEvidence({
    this.ssid,
    this.bssid,
    this.restricted = false,
  });

  final String? ssid;
  final String? bssid;
  final bool restricted;
}

class AttendanceWifiService {
  AttendanceWifiService({Connectivity? connectivity, NetworkInfo? networkInfo})
    : _connectivity = connectivity ?? Connectivity(),
      _networkInfo = networkInfo ?? NetworkInfo();

  final Connectivity _connectivity;
  final NetworkInfo _networkInfo;

  Future<AttendanceWifiEvidence> collect() async {
    if (!Platform.isAndroid && !Platform.isIOS) {
      throw AttendanceEvidenceException(AttendanceEvidenceIssue.wifiRestricted);
    }

    final connectivity = await _connectivity.checkConnectivity();
    if (!connectivity.contains(ConnectivityResult.wifi)) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.wifiUnavailable,
      );
    }

    final ssid = _cleanWifiValue(await _networkInfo.getWifiName());
    final bssid = _cleanWifiValue(await _networkInfo.getWifiBSSID());
    if (ssid == null && bssid == null) {
      throw AttendanceEvidenceException(AttendanceEvidenceIssue.wifiRestricted);
    }

    return AttendanceWifiEvidence(ssid: ssid, bssid: bssid);
  }

  String? _cleanWifiValue(String? value) {
    final cleaned = value?.replaceAll('"', '').trim();
    if (cleaned == null ||
        cleaned.isEmpty ||
        cleaned.toLowerCase() == '<unknown ssid>' ||
        cleaned == '02:00:00:00:00:00') {
      return null;
    }
    return cleaned;
  }
}

final attendanceWifiServiceProvider = Provider<AttendanceWifiService>((ref) {
  return AttendanceWifiService();
});
