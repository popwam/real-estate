import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'lead_claim_models.dart';

class LeadClaimsRepository {
  LeadClaimsRepository(this._dio);

  final Dio _dio;

  Future<LeadClaim> create({
    required String clientName,
    required String clientPhone,
    required String projectId,
    String? unitId,
    String? notes,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/lead-claims',
      data: {
        'clientName': clientName,
        'phone': clientPhone,
        'projectId': projectId,
        if (unitId != null && unitId.isNotEmpty) 'unitId': unitId,
        'source': 'MANUAL',
        if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      },
    );
    return LeadClaim.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<LeadClaim>> myClaims() async {
    final response = await _dio.get<List<dynamic>>('/lead-claims/my');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(LeadClaim.fromJson)
        .toList();
  }

  Future<LeadClaim> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/lead-claims/$id');
    return LeadClaim.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<LeadClaim> release(String id) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/lead-claims/$id/release',
    );
    return LeadClaim.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<LeadClaimConflict>> conflicts() async {
    final response = await _dio.get<List<dynamic>>('/lead-claims/conflicts');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(LeadClaimConflict.fromJson)
        .toList();
  }
}

final leadClaimsRepositoryProvider = Provider<LeadClaimsRepository>((ref) {
  return LeadClaimsRepository(ref.watch(dioProvider));
});

final myLeadClaimsProvider = FutureProvider.autoDispose<List<LeadClaim>>((ref) {
  return ref.watch(leadClaimsRepositoryProvider).myClaims();
});

final leadClaimDetailProvider = FutureProvider.autoDispose
    .family<LeadClaim, String>((ref, id) {
      return ref.watch(leadClaimsRepositoryProvider).detail(id);
    });
