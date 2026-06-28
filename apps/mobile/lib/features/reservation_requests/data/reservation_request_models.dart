import '../../../features/lead_claims/data/lead_claim_models.dart';
import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../shared/models/json_helpers.dart';

enum ReservationRequestStatus {
  pending('PENDING'),
  approved('APPROVED'),
  rejected('REJECTED'),
  cancelled('CANCELLED'),
  unknown('UNKNOWN');

  const ReservationRequestStatus(this.value);

  final String value;

  static ReservationRequestStatus from(String value) {
    return ReservationRequestStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => ReservationRequestStatus.unknown,
    );
  }
}

class ReservationRequest {
  const ReservationRequest({
    required this.id,
    required this.status,
    required this.leadClaimId,
    required this.projectId,
    required this.unitId,
    this.notes,
    this.rejectionReason,
    this.createdAt,
    this.approvedAt,
    this.rejectedAt,
    this.cancelledAt,
    this.project,
    this.unit,
    this.leadClaim,
  });

  final String id;
  final String status;
  final String leadClaimId;
  final String projectId;
  final String unitId;
  final String? notes;
  final String? rejectionReason;
  final String? createdAt;
  final String? approvedAt;
  final String? rejectedAt;
  final String? cancelledAt;
  final MarketplaceProject? project;
  final MarketplaceUnit? unit;
  final LeadClaim? leadClaim;

  ReservationRequestStatus get statusType =>
      ReservationRequestStatus.from(status);
  bool get isPending => statusType == ReservationRequestStatus.pending;

  factory ReservationRequest.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final unit = json['unit'];
    final leadClaim = json['leadClaim'];

    return ReservationRequest(
      id: stringValue(json, 'id'),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      leadClaimId: stringValue(json, 'leadClaimId'),
      projectId: stringValue(json, 'projectId'),
      unitId: stringValue(json, 'unitId'),
      notes: json['notes']?.toString(),
      rejectionReason: json['rejectionReason']?.toString(),
      createdAt: json['createdAt']?.toString(),
      approvedAt: json['approvedAt']?.toString(),
      rejectedAt: json['rejectedAt']?.toString(),
      cancelledAt: json['cancelledAt']?.toString(),
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
      unit: unit is Map<String, dynamic>
          ? MarketplaceUnit.fromJson(unit)
          : null,
      leadClaim: leadClaim is Map<String, dynamic>
          ? LeadClaim.fromJson(leadClaim)
          : null,
    );
  }
}
