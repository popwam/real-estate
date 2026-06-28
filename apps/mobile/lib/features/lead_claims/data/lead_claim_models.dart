import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../shared/models/json_helpers.dart';

enum LeadClaimStatus {
  active('ACTIVE'),
  released('RELEASED'),
  expired('EXPIRED'),
  unknown('UNKNOWN');

  const LeadClaimStatus(this.value);

  final String value;

  static LeadClaimStatus from(String value) {
    return LeadClaimStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => LeadClaimStatus.unknown,
    );
  }
}

class LeadClaim {
  const LeadClaim({
    required this.id,
    required this.projectId,
    required this.status,
    this.unitId,
    this.notes,
    this.source,
    this.expiresAt,
    this.createdAt,
    this.releasedAt,
    this.clientName,
    this.clientPhoneLast4,
    this.project,
    this.unit,
  });

  final String id;
  final String projectId;
  final String? unitId;
  final String status;
  final String? notes;
  final String? source;
  final String? expiresAt;
  final String? createdAt;
  final String? releasedAt;
  final String? clientName;
  final String? clientPhoneLast4;
  final MarketplaceProject? project;
  final MarketplaceUnit? unit;

  LeadClaimStatus get statusType => LeadClaimStatus.from(status);
  bool get isActive => statusType == LeadClaimStatus.active;

  String get maskedPhone {
    if (clientPhoneLast4 == null || clientPhoneLast4!.isEmpty) {
      return 'Phone hidden';
    }
    return '*** ${clientPhoneLast4!}';
  }

  factory LeadClaim.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final unit = json['unit'];
    final client = json['client'];
    final lead = json['lead'];

    return LeadClaim(
      id: stringValue(json, 'id'),
      projectId: stringValue(json, 'projectId'),
      unitId: json['unitId']?.toString(),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      notes:
          json['notes']?.toString() ??
          (lead is Map<String, dynamic> ? lead['notes']?.toString() : null),
      source: json['source']?.toString(),
      expiresAt: json['expiresAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
      releasedAt: json['releasedAt']?.toString(),
      clientName: client is Map<String, dynamic>
          ? client['name']?.toString()
          : json['clientName']?.toString(),
      clientPhoneLast4: client is Map<String, dynamic>
          ? client['phoneLast4']?.toString()
          : json['clientPhoneLast4']?.toString(),
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
      unit: unit is Map<String, dynamic>
          ? MarketplaceUnit.fromJson(unit)
          : null,
    );
  }
}

class LeadClaimConflict {
  const LeadClaimConflict({
    required this.id,
    required this.projectId,
    required this.resolution,
    this.notes,
    this.createdAt,
    this.resolvedAt,
    this.project,
  });

  final String id;
  final String projectId;
  final String resolution;
  final String? notes;
  final String? createdAt;
  final String? resolvedAt;
  final MarketplaceProject? project;

  factory LeadClaimConflict.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    return LeadClaimConflict(
      id: stringValue(json, 'id'),
      projectId: stringValue(json, 'projectId'),
      resolution: stringValue(json, 'resolution', fallback: 'PENDING'),
      notes: json['notes']?.toString(),
      createdAt: json['createdAt']?.toString(),
      resolvedAt: json['resolvedAt']?.toString(),
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
    );
  }
}
