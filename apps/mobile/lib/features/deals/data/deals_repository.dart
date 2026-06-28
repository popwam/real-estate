import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'deal_models.dart';

class DealsRepository {
  DealsRepository(this._dio);

  final Dio _dio;

  Future<List<Deal>> myDeals() async {
    final response = await _dio.get<List<dynamic>>('/deals');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Deal.fromJson)
        .toList();
  }

  Future<Deal> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/deals/$id');
    return Deal.fromJson(response.data ?? <String, dynamic>{});
  }
}

final dealsRepositoryProvider = Provider<DealsRepository>((ref) {
  return DealsRepository(ref.watch(dioProvider));
});

final myDealsProvider = FutureProvider.autoDispose<List<Deal>>((ref) {
  return ref.watch(dealsRepositoryProvider).myDeals();
});

final dealDetailProvider = FutureProvider.autoDispose.family<Deal, String>((
  ref,
  id,
) {
  return ref.watch(dealsRepositoryProvider).detail(id);
});
