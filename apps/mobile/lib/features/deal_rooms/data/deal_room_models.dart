import '../../../features/marketplace/data/marketplace_models.dart';
import '../../../features/reservation_requests/data/reservation_request_models.dart';
import '../../../shared/models/json_helpers.dart';

enum DealRoomStatus {
  open('OPEN'),
  negotiation('NEGOTIATION'),
  pendingApproval('PENDING_APPROVAL'),
  approved('APPROVED'),
  sold('SOLD'),
  cancelled('CANCELLED'),
  unknown('UNKNOWN');

  const DealRoomStatus(this.value);

  final String value;

  static DealRoomStatus from(String value) {
    return DealRoomStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => DealRoomStatus.unknown,
    );
  }
}

enum DealRoomParticipantRole {
  broker('BROKER'),
  developerSales('DEVELOPER_SALES'),
  salesManager('SALES_MANAGER'),
  client('CLIENT'),
  observer('OBSERVER'),
  unknown('UNKNOWN');

  const DealRoomParticipantRole(this.value);

  final String value;

  static DealRoomParticipantRole from(String value) {
    return DealRoomParticipantRole.values.firstWhere(
      (role) => role.value == value.toUpperCase(),
      orElse: () => DealRoomParticipantRole.unknown,
    );
  }
}

enum DealRoomMessageType {
  text('TEXT'),
  system('SYSTEM'),
  statusUpdate('STATUS_UPDATE'),
  unknown('UNKNOWN');

  const DealRoomMessageType(this.value);

  final String value;

  static DealRoomMessageType from(String value) {
    return DealRoomMessageType.values.firstWhere(
      (type) => type.value == value.toUpperCase(),
      orElse: () => DealRoomMessageType.unknown,
    );
  }
}

class DealRoom {
  const DealRoom({
    required this.id,
    required this.status,
    required this.reservationRequestId,
    required this.projectId,
    required this.unitId,
    this.createdAt,
    this.clientInvitedAt,
    this.project,
    this.unit,
    this.reservationRequest,
    this.participants = const [],
    this.messageCount,
    this.lastMessage,
  });

  final String id;
  final String status;
  final String reservationRequestId;
  final String projectId;
  final String unitId;
  final String? createdAt;
  final String? clientInvitedAt;
  final MarketplaceProject? project;
  final MarketplaceUnit? unit;
  final ReservationRequest? reservationRequest;
  final List<DealRoomParticipant> participants;
  final int? messageCount;
  final DealRoomMessage? lastMessage;

  DealRoomStatus get statusType => DealRoomStatus.from(status);

  factory DealRoom.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final unit = json['unit'];
    final reservationRequest = json['reservationRequest'];
    final participants = json['participants'];
    final count = json['_count'];
    final messages = json['messages'];

    return DealRoom(
      id: stringValue(json, 'id'),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      reservationRequestId: stringValue(json, 'reservationRequestId'),
      projectId: stringValue(json, 'projectId'),
      unitId: stringValue(json, 'unitId'),
      createdAt: json['createdAt']?.toString(),
      clientInvitedAt: json['clientInvitedAt']?.toString(),
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
      unit: unit is Map<String, dynamic> ? MarketplaceUnit.fromJson(unit) : null,
      reservationRequest: reservationRequest is Map<String, dynamic>
          ? ReservationRequest.fromJson(reservationRequest)
          : null,
      participants: participants is List
          ? participants
              .whereType<Map<String, dynamic>>()
              .map(DealRoomParticipant.fromJson)
              .toList()
          : const [],
      messageCount: count is Map<String, dynamic>
          ? intValue(count, 'messages')
          : intValue(json, 'messageCount'),
      lastMessage: messages is List && messages.isNotEmpty
          ? DealRoomMessage.fromJson(messages.last as Map<String, dynamic>)
          : null,
    );
  }
}

class DealRoomParticipant {
  const DealRoomParticipant({
    required this.id,
    required this.role,
    required this.status,
    this.createdAt,
    this.invitedAt,
    this.joinedAt,
    this.displayName,
  });

  final String id;
  final String role;
  final String status;
  final String? createdAt;
  final String? invitedAt;
  final String? joinedAt;
  final String? displayName;

  DealRoomParticipantRole get roleType => DealRoomParticipantRole.from(role);

  factory DealRoomParticipant.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final client = json['client'];
    final organization = json['organization'];

    final userName = user is Map<String, dynamic>
        ? [
            user['firstName']?.toString(),
            user['lastName']?.toString(),
          ].where((part) => part != null && part.isNotEmpty).join(' ')
        : '';

    return DealRoomParticipant(
      id: stringValue(json, 'id'),
      role: stringValue(json, 'role', fallback: 'UNKNOWN'),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      createdAt: json['createdAt']?.toString(),
      invitedAt: json['invitedAt']?.toString(),
      joinedAt: json['joinedAt']?.toString(),
      displayName: userName.isNotEmpty
          ? userName
          : client is Map<String, dynamic>
              ? client['name']?.toString()
              : organization is Map<String, dynamic>
                  ? organization['name']?.toString()
                  : null,
    );
  }
}

class DealRoomMessage {
  const DealRoomMessage({
    required this.id,
    required this.messageType,
    required this.body,
    this.createdAt,
    this.senderName,
  });

  final String id;
  final String messageType;
  final String body;
  final String? createdAt;
  final String? senderName;

  DealRoomMessageType get type => DealRoomMessageType.from(messageType);

  factory DealRoomMessage.fromJson(Map<String, dynamic> json) {
    final senderUser = json['senderUser'];
    final senderClient = json['senderClient'];
    final userName = senderUser is Map<String, dynamic>
        ? [
            senderUser['firstName']?.toString(),
            senderUser['lastName']?.toString(),
          ].where((part) => part != null && part.isNotEmpty).join(' ')
        : '';

    return DealRoomMessage(
      id: stringValue(json, 'id'),
      messageType: stringValue(json, 'messageType', fallback: 'TEXT'),
      body: stringValue(json, 'body'),
      createdAt: json['createdAt']?.toString(),
      senderName: userName.isNotEmpty
          ? userName
          : senderClient is Map<String, dynamic>
              ? senderClient['name']?.toString()
              : null,
    );
  }
}
