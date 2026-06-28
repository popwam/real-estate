import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'crm_models.dart';

class CrmRepository {
  CrmRepository(this._dio);

  final Dio _dio;

  Future<CrmSummary> summary() async {
    final response = await _dio.get<Map<String, dynamic>>('/crm/summary');
    return CrmSummary.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<CrmLead>> leads([
    CrmLeadFilters filters = const CrmLeadFilters(),
  ]) async {
    final response = await _dio.get<dynamic>(
      '/crm/leads',
      queryParameters: filters.toQuery(),
    );
    return crmLeadsFromResponse(response.data);
  }

  Future<List<CrmLead>> marketplaceLeads([
    CrmLeadFilters filters = const CrmLeadFilters(),
  ]) async {
    final response = await _dio.get<dynamic>(
      '/crm/leads/marketplace',
      queryParameters: filters.toQuery(),
    );
    return crmLeadsFromResponse(response.data);
  }

  Future<CrmLead> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/crm/leads/$id');
    return CrmLead.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<CrmLead> claim(String id) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/crm/leads/$id/claim',
    );
    return CrmLead.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<CrmLead> updateStatus(
    String id, {
    required String status,
    String? statusNote,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/crm/leads/$id/status',
      data: {
        'status': status,
        if (statusNote != null && statusNote.trim().isNotEmpty)
          'statusNote': statusNote.trim(),
      },
    );
    return CrmLead.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<String> createConversationFromLead(String id) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/conversations/from-crm-lead/$id',
      data: {'openingMessage': 'Conversation opened from mobile CRM.'},
    );
    return response.data?['id']?.toString() ?? '';
  }
}

final crmRepositoryProvider = Provider<CrmRepository>((ref) {
  return CrmRepository(ref.watch(dioProvider));
});

final crmSummaryProvider = FutureProvider.autoDispose<CrmSummary>((ref) {
  return ref.watch(crmRepositoryProvider).summary();
});

final crmLeadsProvider = FutureProvider.autoDispose
    .family<List<CrmLead>, CrmLeadFilters>((ref, filters) {
      return ref.watch(crmRepositoryProvider).leads(filters);
    });

final marketplaceCrmLeadsProvider = FutureProvider.autoDispose
    .family<List<CrmLead>, CrmLeadFilters>((ref, filters) {
      return ref.watch(crmRepositoryProvider).marketplaceLeads(filters);
    });

final crmLeadDetailProvider = FutureProvider.autoDispose
    .family<CrmLead, String>((ref, id) {
      return ref.watch(crmRepositoryProvider).detail(id);
    });
