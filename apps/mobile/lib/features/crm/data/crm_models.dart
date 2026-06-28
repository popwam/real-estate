import '../../../shared/models/json_helpers.dart';

enum CrmLeadStatus {
  newLead('NEW'),
  claimed('CLAIMED'),
  inConversation('IN_CONVERSATION'),
  qualified('QUALIFIED'),
  lost('LOST'),
  converted('CONVERTED'),
  spam('SPAM'),
  unknown('UNKNOWN');

  const CrmLeadStatus(this.value);

  final String value;

  static CrmLeadStatus from(String value) {
    return CrmLeadStatus.values.firstWhere(
      (status) => status.value == value.toUpperCase(),
      orElse: () => CrmLeadStatus.unknown,
    );
  }
}

enum PreferredContactMethod {
  call('CALL'),
  chat('CHAT'),
  whatsapp('WHATSAPP'),
  unknown('UNKNOWN');

  const PreferredContactMethod(this.value);

  final String value;

  static PreferredContactMethod from(String value) {
    return PreferredContactMethod.values.firstWhere(
      (method) => method.value == value.toUpperCase(),
      orElse: () => PreferredContactMethod.unknown,
    );
  }
}

class CrmSummary {
  const CrmSummary({
    required this.totalLeads,
    required this.newLeads,
    required this.claimedLeads,
    required this.qualifiedLeads,
    required this.openConversations,
    required this.todayNewLeads,
    required this.todayNewMessages,
  });

  final int totalLeads;
  final int newLeads;
  final int claimedLeads;
  final int qualifiedLeads;
  final int openConversations;
  final int todayNewLeads;
  final int todayNewMessages;

  factory CrmSummary.fromJson(Map<String, dynamic> json) {
    final leads = json['leads'] is Map<String, dynamic>
        ? json['leads'] as Map<String, dynamic>
        : <String, dynamic>{};
    final conversations = json['conversations'] is Map<String, dynamic>
        ? json['conversations'] as Map<String, dynamic>
        : <String, dynamic>{};
    final today = json['today'] is Map<String, dynamic>
        ? json['today'] as Map<String, dynamic>
        : <String, dynamic>{};

    return CrmSummary(
      totalLeads: intValue(leads, 'total') ?? 0,
      newLeads: intValue(leads, 'new') ?? 0,
      claimedLeads: intValue(leads, 'claimed') ?? 0,
      qualifiedLeads: intValue(leads, 'qualified') ?? 0,
      openConversations: intValue(conversations, 'open') ?? 0,
      todayNewLeads: intValue(today, 'newLeads') ?? 0,
      todayNewMessages: intValue(today, 'newMessages') ?? 0,
    );
  }
}

class CrmLeadFilters {
  const CrmLeadFilters({this.status, this.preferredContactMethod});

  final String? status;
  final String? preferredContactMethod;

  Map<String, dynamic> toQuery() {
    return {
      if (status != null && status!.isNotEmpty) 'status': status,
      if (preferredContactMethod != null && preferredContactMethod!.isNotEmpty)
        'preferredContactMethod': preferredContactMethod,
      if (status != null || preferredContactMethod != null) 'pageSize': 50,
    };
  }

  @override
  bool operator ==(Object other) {
    return other is CrmLeadFilters &&
        other.status == status &&
        other.preferredContactMethod == preferredContactMethod;
  }

  @override
  int get hashCode => Object.hash(status, preferredContactMethod);
}

class CrmClientSummary {
  const CrmClientSummary({required this.name, this.phoneLast4, this.email});

  final String name;
  final String? phoneLast4;
  final String? email;

  factory CrmClientSummary.fromJson(Map<String, dynamic> json) {
    return CrmClientSummary(
      name: stringValue(json, 'name', fallback: 'Client'),
      phoneLast4: json['phoneLast4']?.toString(),
      email: json['email']?.toString(),
    );
  }
}

class CrmProjectSummary {
  const CrmProjectSummary({required this.id, required this.name, this.slug});

  final String id;
  final String name;
  final String? slug;

  factory CrmProjectSummary.fromJson(Map<String, dynamic> json) {
    return CrmProjectSummary(
      id: stringValue(json, 'id'),
      name: stringValue(json, 'name', fallback: 'Project'),
      slug: json['slug']?.toString(),
    );
  }
}

class CrmOrganizationSummary {
  const CrmOrganizationSummary({required this.name, this.slug});

  final String name;
  final String? slug;

  factory CrmOrganizationSummary.fromJson(Map<String, dynamic> json) {
    return CrmOrganizationSummary(
      name: stringValue(json, 'name', fallback: 'Organization'),
      slug: json['slug']?.toString(),
    );
  }
}

class CrmLead {
  const CrmLead({
    required this.id,
    required this.status,
    required this.preferredContactMethod,
    this.statusNote,
    this.client,
    this.project,
    this.claimedByOrganization,
    this.sourcePage,
    this.utm,
    this.createdAt,
    this.claimedAt,
    this.unavailable = false,
  });

  final String id;
  final String status;
  final String preferredContactMethod;
  final String? statusNote;
  final CrmClientSummary? client;
  final CrmProjectSummary? project;
  final CrmOrganizationSummary? claimedByOrganization;
  final String? sourcePage;
  final Map<String, dynamic>? utm;
  final String? createdAt;
  final String? claimedAt;
  final bool unavailable;

  CrmLeadStatus get statusType => CrmLeadStatus.from(status);

  PreferredContactMethod get contactMethodType =>
      PreferredContactMethod.from(preferredContactMethod);

  bool get isClaimed =>
      claimedAt != null || claimedByOrganization != null || status == 'CLAIMED';

  factory CrmLead.fromJson(Map<String, dynamic> json) {
    final client = json['client'];
    final project = json['project'];
    final organization = json['claimedByOrganization'];
    final utm = json['utm'];

    return CrmLead(
      id: stringValue(json, 'id'),
      status: stringValue(json, 'status', fallback: 'UNKNOWN'),
      preferredContactMethod: stringValue(
        json,
        'preferredContactMethod',
        fallback: 'CALL',
      ),
      statusNote: json['statusNote']?.toString(),
      client: client is Map<String, dynamic>
          ? CrmClientSummary.fromJson(client)
          : null,
      project: project is Map<String, dynamic>
          ? CrmProjectSummary.fromJson(project)
          : null,
      claimedByOrganization: organization is Map<String, dynamic>
          ? CrmOrganizationSummary.fromJson(organization)
          : null,
      sourcePage: json['sourcePage']?.toString(),
      utm: utm is Map<String, dynamic> ? utm : null,
      createdAt: json['createdAt']?.toString(),
      claimedAt: json['claimedAt']?.toString(),
      unavailable: json['unavailable'] == true,
    );
  }
}

List<CrmLead> crmLeadsFromResponse(dynamic data) {
  final items = data is Map<String, dynamic> ? data['items'] : data;
  if (items is! List) {
    return const [];
  }
  return items.whereType<Map<String, dynamic>>().map(CrmLead.fromJson).toList();
}
