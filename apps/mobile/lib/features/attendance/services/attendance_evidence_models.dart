import '../data/attendance_repository.dart';

enum AttendanceEvidenceIssue {
  locationPermissionDenied,
  locationServiceDisabled,
  wifiUnavailable,
  wifiRestricted,
  developerOptionsEnabled,
  usbDebuggingEnabled,
  cameraPermissionDenied,
  photoCaptureCancelled,
  photoUploadFailed,
}

class AttendanceEvidenceException implements Exception {
  AttendanceEvidenceException(this.issue, [this.cause]);

  final AttendanceEvidenceIssue issue;
  final Object? cause;
}

class AttendanceEvidenceResult {
  const AttendanceEvidenceResult({
    required this.payload,
    this.issues = const [],
  });

  final AttendanceVerificationPayload payload;
  final List<AttendanceEvidenceIssue> issues;
}
