import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';

import 'attendance_evidence_models.dart';

class AttendanceLocationEvidence {
  const AttendanceLocationEvidence({
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
    required this.capturedAt,
  });

  final double latitude;
  final double longitude;
  final double? accuracyMeters;
  final DateTime capturedAt;
}

class AttendanceLocationService {
  Future<AttendanceLocationEvidence> collect() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.locationServiceDisabled,
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.locationPermissionDenied,
      );
    }

    Position position;
    try {
      position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
    } on TimeoutException {
      throw AttendanceEvidenceException(AttendanceEvidenceIssue.locationUnavailable);
    }
    final capturedAt = position.timestamp;
    final age = DateTime.now().difference(capturedAt);
    if (age > const Duration(minutes: 2) || age < const Duration(minutes: -1)) {
      throw AttendanceEvidenceException(AttendanceEvidenceIssue.locationUnavailable);
    }
    return AttendanceLocationEvidence(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracyMeters: position.accuracy,
      capturedAt: capturedAt,
    );
  }
}

final attendanceLocationServiceProvider = Provider<AttendanceLocationService>((
  ref,
) {
  return AttendanceLocationService();
});
