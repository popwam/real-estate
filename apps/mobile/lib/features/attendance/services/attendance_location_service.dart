import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import 'attendance_evidence_models.dart';

class AttendanceLocationEvidence {
  const AttendanceLocationEvidence({
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
  });

  final double latitude;
  final double longitude;
  final double? accuracyMeters;
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

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    return AttendanceLocationEvidence(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracyMeters: position.accuracy,
    );
  }
}

final attendanceLocationServiceProvider = Provider<AttendanceLocationService>((
  ref,
) {
  return AttendanceLocationService();
});
