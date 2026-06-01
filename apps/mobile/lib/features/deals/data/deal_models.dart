import '../../../features/deal_rooms/data/deal_room_models.dart';
import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../shared/models/json_helpers.dart';

enum DealStatus {
  pendingApproval('PENDING_APPROVAL'),
  approved('APPROVED'),
  sold('SOLD'),
  cancelled('CANCELLED'),
  disputed('DISPUTED'),
  unknown('UNKNOWN');

  const DealStatus(this.value);

  final String value;

  static DealStatus from(String value) {
    return DealStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => DealStatus.unknown,
    );
  }
}

class Deal {
  const Deal({
    required this.id,
    required this.status,
    required this.dealRoomId,
    required this.projectId,
    required this.unitId,
    this.finalPrice,
    this.currency,
    this.createdAt,
    this.approvedAt,
    this.soldAt,
    this.cancelledAt,
    this.project,
    this.unit,
    this.dealRoom,
    this.brokerName,
    this.brokerageName,
    this.clientName,
  });

  final String id;
  final String status;
  final String dealRoomId;
  final String projectId;
  final String unitId;
  final double? finalPrice;
  final String? currency;
  final String? createdAt;
  final String? approvedAt;
  final String? soldAt;
  final String? cancelledAt;
  final MarketplaceProject? project;
  final MarketplaceUnit? unit;
  final DealRoom? dealRoom;
  final String? brokerName;
  final String? brokerageName;
  final String? clientName;

  DealStatus get statusType => DealStatus.from(status);

  factory Deal.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final unit = json['unit'];
    final dealRoom = json['dealRoom'];
    final broker = json['broker'];
    final brokerage = json['brokerage'];
    final client = json['client'];
    final brokerName = broker is Map<String, dynamic>
        ? [
            broker['firstName']?.toString(),
            broker['lastName']?.toString(),
          ].where((part) => part != null && part.isNotEmpty).join(' ')
        : '';

    return Deal(
      id: stringValue(json, 'id'),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      dealRoomId: stringValue(json, 'dealRoomId'),
      projectId: stringValue(json, 'projectId'),
      unitId: stringValue(json, 'unitId'),
      finalPrice: doubleValue(json, 'finalPrice'),
      currency: json['currency']?.toString(),
      createdAt: json['createdAt']?.toString(),
      approvedAt: json['approvedAt']?.toString(),
      soldAt: json['soldAt']?.toString(),
      cancelledAt: json['cancelledAt']?.toString(),
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
      unit: unit is Map<String, dynamic> ? MarketplaceUnit.fromJson(unit) : null,
      dealRoom:
          dealRoom is Map<String, dynamic> ? DealRoom.fromJson(dealRoom) : null,
      brokerName: brokerName.isNotEmpty ? brokerName : null,
      brokerageName: brokerage is Map<String, dynamic>
          ? brokerage['name']?.toString()
          : null,
      clientName: client is Map<String, dynamic> ? client['name']?.toString() : null,
    );
  }
}
