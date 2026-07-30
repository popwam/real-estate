import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/attendance_repository.dart';
import 'attendance_device_integrity_service.dart';
import 'attendance_evidence_models.dart';
import 'attendance_location_service.dart';
import 'attendance_photo_service.dart';
import 'attendance_wifi_service.dart';

abstract class AttendanceEvidenceCollector {
  Future<AttendanceEvidenceResult> collect(
    BuildContext context, {
    required String purpose,
    AttendanceLocationEvidence? locationEvidence,
  });
}

class NativeAttendanceEvidenceCollector implements AttendanceEvidenceCollector {
  NativeAttendanceEvidenceCollector({
    required AttendanceDeviceIntegrityService deviceIntegrity,
    required AttendanceLocationService location,
    required AttendanceWifiService wifi,
    required AttendancePhotoService photo,
  }) : _deviceIntegrity = deviceIntegrity,
       _location = location,
       _wifi = wifi,
       _photo = photo;

  final AttendanceDeviceIntegrityService _deviceIntegrity;
  final AttendanceLocationService _location;
  final AttendanceWifiService _wifi;
  final AttendancePhotoService _photo;

  @override
  Future<AttendanceEvidenceResult> collect(
    BuildContext context, {
    required String purpose,
    AttendanceLocationEvidence? locationEvidence,
  }) async {
    final issues = <AttendanceEvidenceIssue>[];

    String? deviceId;
    bool? developerOptionsEnabled;
    bool? usbDebuggingEnabled;
    double? latitude;
    double? longitude;
    double? locationAccuracyMeters;
    DateTime? locationCapturedAt;
    String? wifiSsid;
    String? wifiBssid;
    String? photoFileId;

    try {
      final integrity = await _deviceIntegrity.collect();
      deviceId = integrity.deviceId;
      developerOptionsEnabled = integrity.developerOptionsEnabled;
      usbDebuggingEnabled = integrity.usbDebuggingEnabled;
      if (developerOptionsEnabled == true) {
        issues.add(AttendanceEvidenceIssue.developerOptionsEnabled);
      }
      if (usbDebuggingEnabled == true) {
        issues.add(AttendanceEvidenceIssue.usbDebuggingEnabled);
      }
    } on AttendanceEvidenceException catch (error) {
      issues.add(error.issue);
    } catch (_) {
      // Device integrity is platform-dependent; missing values stay null.
    }

    try {
      final position = locationEvidence ?? await _location.collect();
      latitude = position.latitude;
      longitude = position.longitude;
      locationAccuracyMeters = position.accuracyMeters;
      locationCapturedAt = position.capturedAt;
    } on AttendanceEvidenceException catch (error) {
      issues.add(error.issue);
    }

    try {
      if (!context.mounted) {
        throw AttendanceEvidenceException(AttendanceEvidenceIssue.photoCaptureCancelled);
      }
      final capturedPhoto = await _photo.captureLivePhoto(context);
      photoFileId = await _photo.uploadAttendancePhoto(
        capturedPhoto,
        purpose: purpose,
      );
    } on AttendanceEvidenceException catch (error) {
      if (error.issue == AttendanceEvidenceIssue.photoUploadFailed ||
          error.issue == AttendanceEvidenceIssue.cameraPermissionDenied ||
          error.issue == AttendanceEvidenceIssue.photoCaptureCancelled) {
        rethrow;
      }
      issues.add(error.issue);
    }

    try {
      final network = await _wifi.collect();
      wifiSsid = network.ssid;
      wifiBssid = network.bssid;
    } on AttendanceEvidenceException catch (error) {
      issues.add(error.issue);
    }

    return AttendanceEvidenceResult(
      payload: AttendanceVerificationPayload(
        latitude: latitude,
        longitude: longitude,
        locationAccuracyMeters: locationAccuracyMeters,
        locationCapturedAt: locationCapturedAt,
        wifiSsid: wifiSsid,
        wifiBssid: wifiBssid,
        photoFileId: photoFileId,
        deviceId: deviceId,
        developerOptionsEnabled: developerOptionsEnabled,
        usbDebuggingEnabled: usbDebuggingEnabled,
      ),
      issues: issues.toSet().toList(),
    );
  }
}

final attendanceEvidenceCollectorProvider =
    Provider<AttendanceEvidenceCollector>((ref) {
      return NativeAttendanceEvidenceCollector(
        deviceIntegrity: ref.watch(attendanceDeviceIntegrityServiceProvider),
        location: ref.watch(attendanceLocationServiceProvider),
        wifi: ref.watch(attendanceWifiServiceProvider),
        photo: ref.watch(attendancePhotoServiceProvider),
      );
    });
