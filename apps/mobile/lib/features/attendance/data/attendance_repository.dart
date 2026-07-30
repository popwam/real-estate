import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'attendance_models.dart';

class AttendanceRepository {
  AttendanceRepository(this._dio);

  final Dio _dio;

  Future<AttendanceRecord> today() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/hr/attendance/me/today',
    );
    return AttendanceRecord.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<AttendanceRecord>> history() async {
    final response = await _dio.get<List<dynamic>>('/hr/attendance/me/history');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(AttendanceRecord.fromJson)
        .toList();
  }

  Future<AttendanceRecord> checkIn({
    String? note,
    AttendanceVerificationPayload payload =
        const AttendanceVerificationPayload(),
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/hr/attendance/check-in',
      data: {
        ...payload.toJson(),
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return AttendanceRecord.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<AttendancePreflight> checkInPreflight(AttendanceVerificationPayload payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/hr/attendance/check-in/preflight',
      data: payload.toJson(),
    );
    return AttendancePreflight.fromJson(response.data ?? const {});
  }

  Future<AttendanceRecord> checkOut({
    String? note,
    AttendanceVerificationPayload payload =
        const AttendanceVerificationPayload(),
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/hr/attendance/check-out',
      data: {
        ...payload.toJson(),
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return AttendanceRecord.fromJson(response.data ?? <String, dynamic>{});
  }
}

class AttendancePreflight {
  const AttendancePreflight({required this.allowed, this.blockingReasons = const []});
  final bool allowed;
  final List<String> blockingReasons;
  factory AttendancePreflight.fromJson(Map<String, dynamic> json) => AttendancePreflight(
    allowed: json['allowed'] == true,
    blockingReasons: (json['blockingReasons'] as List? ?? const [])
        .map<String>((value) => value.toString())
        .toList(),
  );
}

class AttendanceVerificationPayload {
  const AttendanceVerificationPayload({
    this.latitude,
    this.longitude,
    this.locationAccuracyMeters,
    this.locationCapturedAt,
    this.wifiSsid,
    this.wifiBssid,
    this.photoFileId,
    this.deviceId,
    this.developerOptionsEnabled,
    this.usbDebuggingEnabled,
  });

  final double? latitude;
  final double? longitude;
  final double? locationAccuracyMeters;
  final DateTime? locationCapturedAt;
  final String? wifiSsid;
  final String? wifiBssid;
  final String? photoFileId;
  final String? deviceId;
  final bool? developerOptionsEnabled;
  final bool? usbDebuggingEnabled;

  Map<String, dynamic> toJson() {
    return {
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (locationAccuracyMeters != null)
        'locationAccuracyMeters': locationAccuracyMeters,
      if (locationCapturedAt != null)
        'locationCapturedAt': locationCapturedAt!.toUtc().toIso8601String(),
      if (wifiSsid != null && wifiSsid!.trim().isNotEmpty)
        'wifiSsid': wifiSsid!.trim(),
      if (wifiBssid != null && wifiBssid!.trim().isNotEmpty)
        'wifiBssid': wifiBssid!.trim(),
      if (photoFileId != null && photoFileId!.trim().isNotEmpty)
        'photoFileId': photoFileId!.trim(),
      if (deviceId != null && deviceId!.trim().isNotEmpty)
        'deviceId': deviceId!.trim(),
      if (developerOptionsEnabled != null)
        'developerOptionsEnabled': developerOptionsEnabled,
      if (usbDebuggingEnabled != null)
        'usbDebuggingEnabled': usbDebuggingEnabled,
    };
  }
}

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(ref.watch(dioProvider));
});

final attendanceTodayProvider = FutureProvider.autoDispose<AttendanceRecord>((
  ref,
) {
  return ref.watch(attendanceRepositoryProvider).today();
});

final attendanceHistoryProvider =
    FutureProvider.autoDispose<List<AttendanceRecord>>((ref) {
      return ref.watch(attendanceRepositoryProvider).history();
    });
