import '../../../shared/models/json_helpers.dart';

class AttendanceRecord {
  const AttendanceRecord({
    this.id,
    required this.date,
    this.employeeId,
    this.checkInAt,
    this.checkOutAt,
    this.status,
    this.note,
    this.verificationStatus,
    this.verificationFailureReasons = const [],
    this.dvrVerificationStatus,
    this.dvrReferenceId,
    this.attendanceSource,
    required this.canCheckIn,
    required this.canCheckOut,
    this.durationMinutes,
    this.autoClosed = false,
    this.autoClosedAt,
    this.autoCloseReason,
    this.checkOutMethod,
    this.checkOutVerificationStatus,
    this.requiresManualReview = false,
    this.reviewReason,
    this.plannedCheckOutAt,
  });

  final String? id;
  final String date;
  final String? employeeId;
  final String? checkInAt;
  final String? checkOutAt;
  final String? status;
  final String? note;
  final String? verificationStatus;
  final List<String> verificationFailureReasons;
  final String? dvrVerificationStatus;
  final String? dvrReferenceId;
  final String? attendanceSource;
  final bool canCheckIn;
  final bool canCheckOut;
  final int? durationMinutes;
  final bool autoClosed;
  final String? autoClosedAt;
  final String? autoCloseReason;
  final String? checkOutMethod;
  final String? checkOutVerificationStatus;
  final bool requiresManualReview;
  final String? reviewReason;
  final String? plannedCheckOutAt;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id']?.toString(),
      date: stringValue(json, 'date'),
      employeeId: json['employeeId']?.toString(),
      checkInAt: json['checkInAt']?.toString(),
      checkOutAt: json['checkOutAt']?.toString(),
      status: json['status']?.toString(),
      note: json['note']?.toString(),
      verificationStatus: json['verificationStatus']?.toString(),
      verificationFailureReasons:
          (json['verificationFailureReasons'] as List<dynamic>? ?? const [])
              .map((reason) => reason.toString())
              .toList(),
      dvrVerificationStatus: json['dvrVerificationStatus']?.toString(),
      dvrReferenceId: json['dvrReferenceId']?.toString(),
      attendanceSource: json['attendanceSource']?.toString(),
      canCheckIn: json['canCheckIn'] == true,
      canCheckOut: json['canCheckOut'] == true,
      durationMinutes: intValue(json, 'durationMinutes'),
      autoClosed: json['autoClosed'] == true,
      autoClosedAt: json['autoClosedAt']?.toString(),
      autoCloseReason: json['autoCloseReason']?.toString(),
      checkOutMethod: json['checkOutMethod']?.toString(),
      checkOutVerificationStatus: json['checkOutVerificationStatus']?.toString(),
      requiresManualReview: json['requiresManualReview'] == true,
      reviewReason: json['reviewReason']?.toString(),
      plannedCheckOutAt: json['plannedCheckOutAt']?.toString(),
    );
  }
}
