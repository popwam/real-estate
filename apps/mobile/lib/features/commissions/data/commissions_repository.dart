import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'commission_models.dart';

class CommissionsRepository {
  CommissionsRepository(this._dio);

  final Dio _dio;

  Future<List<CommissionEntry>> myCommissions() async {
    final response = await _dio.get<List<dynamic>>('/commissions');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(CommissionEntry.fromJson)
        .toList();
  }

  Future<CommissionEntry> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/commissions/$id');
    return CommissionEntry.fromJson(response.data ?? <String, dynamic>{});
  }
}

final commissionsRepositoryProvider = Provider<CommissionsRepository>((ref) {
  return CommissionsRepository(ref.watch(dioProvider));
});

final myCommissionsProvider = FutureProvider.autoDispose<List<CommissionEntry>>(
  (ref) {
    return ref.watch(commissionsRepositoryProvider).myCommissions();
  },
);

final commissionDetailProvider = FutureProvider.autoDispose
    .family<CommissionEntry, String>((ref, id) {
      return ref.watch(commissionsRepositoryProvider).detail(id);
    });
