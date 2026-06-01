import '../../../features/deals/data/deal_models.dart';
import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../shared/models/json_helpers.dart';

enum CommissionStatus {
  pending('PENDING'),
  approved('APPROVED'),
  rejected('REJECTED'),
  paid('PAID'),
  cancelled('CANCELLED'),
  unknown('UNKNOWN');

  const CommissionStatus(this.value);

  final String value;

  static CommissionStatus from(String value) {
    return CommissionStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => CommissionStatus.unknown,
    );
  }
}

enum CommissionPartyType {
  developer('DEVELOPER'),
  brokerage('BROKERAGE'),
  broker('BROKER'),
  platform('PLATFORM'),
  unknown('UNKNOWN');

  const CommissionPartyType(this.value);

  final String value;

  static CommissionPartyType from(String value) {
    return CommissionPartyType.values.firstWhere(
      (type) => type.value == value.toUpperCase(),
      orElse: () => CommissionPartyType.unknown,
    );
  }
}

class CommissionEntry {
  const CommissionEntry({
    required this.id,
    required this.dealId,
    required this.status,
    required this.partyType,
    this.amount,
    this.currency,
    this.commissionType,
    this.createdAt,
    this.approvedAt,
    this.rejectedAt,
    this.rejectionReason,
    this.deal,
    this.project,
    this.unit,
  });

  final String id;
  final String dealId;
  final String status;
  final String partyType;
  final double? amount;
  final String? currency;
  final String? commissionType;
  final String? createdAt;
  final String? approvedAt;
  final String? rejectedAt;
  final String? rejectionReason;
  final Deal? deal;
  final MarketplaceProject? project;
  final MarketplaceUnit? unit;

  CommissionStatus get statusType => CommissionStatus.from(status);
  CommissionPartyType get party => CommissionPartyType.from(partyType);

  factory CommissionEntry.fromJson(Map<String, dynamic> json) {
    final deal = json['deal'];
    final project = json['project'];
    final unit = json['unit'];

    return CommissionEntry(
      id: stringValue(json, 'id'),
      dealId: stringValue(json, 'dealId'),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      partyType: stringValue(json, 'partyType', fallback: 'UNKNOWN'),
      amount: doubleValue(json, 'amount'),
      currency: json['currency']?.toString(),
      commissionType: json['commissionType']?.toString(),
      createdAt: json['createdAt']?.toString(),
      approvedAt: json['approvedAt']?.toString(),
      rejectedAt: json['rejectedAt']?.toString(),
      rejectionReason: json['rejectionReason']?.toString(),
      deal: deal is Map<String, dynamic> ? Deal.fromJson(deal) : null,
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
      unit: unit is Map<String, dynamic> ? MarketplaceUnit.fromJson(unit) : null,
    );
  }
}
