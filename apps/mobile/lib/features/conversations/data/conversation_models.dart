import '../../../features/crm/data/crm_models.dart';
import '../../../shared/models/json_helpers.dart';

enum ConversationStatus {
  open('OPEN'),
  closed('CLOSED'),
  archived('ARCHIVED'),
  unknown('UNKNOWN');

  const ConversationStatus(this.value);

  final String value;

  static ConversationStatus from(String value) {
    return ConversationStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => ConversationStatus.unknown,
    );
  }
}

class ConversationFilters {
  const ConversationFilters({this.status});

  final String? status;

  Map<String, dynamic> toQuery() {
    return {
      if (status != null && status!.isNotEmpty) 'status': status,
      if (status != null) 'pageSize': 50,
    };
  }

  @override
  bool operator ==(Object other) {
    return other is ConversationFilters && other.status == status;
  }

  @override
  int get hashCode => status.hashCode;
}

class ConversationParticipant {
  const ConversationParticipant({
    required this.publicRole,
    this.displayName,
    this.joinedAt,
  });

  final String publicRole;
  final String? displayName;
  final String? joinedAt;

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) {
    return ConversationParticipant(
      publicRole: stringValue(json, 'publicRole', fallback: 'UNKNOWN'),
      displayName: json['displayName']?.toString(),
      joinedAt: json['joinedAt']?.toString(),
    );
  }
}

class ConversationMessage {
  const ConversationMessage({
    required this.id,
    required this.type,
    required this.body,
    this.createdAt,
    this.sender,
  });

  final String id;
  final String type;
  final String body;
  final String? createdAt;
  final ConversationParticipant? sender;

  factory ConversationMessage.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'] ?? json['senderParticipant'];
    return ConversationMessage(
      id: stringValue(json, 'id'),
      type: stringValue(json, 'type', fallback: 'TEXT'),
      body: stringValue(json, 'body'),
      createdAt: json['createdAt']?.toString(),
      sender: sender is Map<String, dynamic>
          ? ConversationParticipant.fromJson(sender)
          : null,
    );
  }
}

class PublicConversationMessagePayload {
  const PublicConversationMessagePayload({required this.body, this.senderName});

  final String body;
  final String? senderName;

  Map<String, dynamic> toJson() {
    return {
      'body': body,
      if (senderName != null && senderName!.trim().isNotEmpty)
        'senderName': senderName!.trim(),
    };
  }
}

class PublicConversationMessageResponse {
  const PublicConversationMessageResponse({
    required this.ok,
    required this.message,
  });

  final bool ok;
  final ConversationMessage message;

  factory PublicConversationMessageResponse.fromJson(
    Map<String, dynamic> json,
  ) {
    final message = json['message'];
    return PublicConversationMessageResponse(
      ok: json['ok'] == true,
      message: message is Map<String, dynamic>
          ? ConversationMessage.fromJson(message)
          : ConversationMessage.fromJson(const <String, dynamic>{}),
    );
  }
}

class Conversation {
  const Conversation({
    required this.id,
    required this.type,
    required this.status,
    this.statusNote,
    this.shareToken,
    this.project,
    this.crmLead,
    this.updatedAt,
    this.createdAt,
    this.participants = const [],
    this.recentMessages = const [],
  });

  final String id;
  final String type;
  final String status;
  final String? statusNote;
  final String? shareToken;
  final CrmProjectSummary? project;
  final CrmLead? crmLead;
  final String? updatedAt;
  final String? createdAt;
  final List<ConversationParticipant> participants;
  final List<ConversationMessage> recentMessages;

  ConversationStatus get statusType => ConversationStatus.from(status);

  factory Conversation.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final crmLead = json['crmLead'];
    final participants = json['participants'];
    final messages = json['recentMessages'] ?? json['messages'];

    return Conversation(
      id: stringValue(json, 'id'),
      type: stringValue(json, 'type', fallback: 'PUBLIC_LEAD'),
      status: stringValue(json, 'status', fallback: 'OPEN'),
      statusNote: json['statusNote']?.toString(),
      shareToken: json['shareToken']?.toString(),
      project: project is Map<String, dynamic>
          ? CrmProjectSummary.fromJson(project)
          : null,
      crmLead: crmLead is Map<String, dynamic>
          ? CrmLead.fromJson(crmLead)
          : null,
      updatedAt: json['updatedAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
      participants: participants is List
          ? participants
                .whereType<Map<String, dynamic>>()
                .map(ConversationParticipant.fromJson)
                .toList()
          : const [],
      recentMessages: messages is List
          ? messages
                .whereType<Map<String, dynamic>>()
                .map(ConversationMessage.fromJson)
                .toList()
          : const [],
    );
  }
}

List<Conversation> conversationsFromResponse(dynamic data) {
  final items = data is Map<String, dynamic> ? data['items'] : data;
  if (items is! List) {
    return const [];
  }
  return items
      .whereType<Map<String, dynamic>>()
      .map(Conversation.fromJson)
      .toList();
}
