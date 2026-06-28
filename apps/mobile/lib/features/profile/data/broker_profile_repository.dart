import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'broker_profile_models.dart';

class BrokerProfileRepository {
  BrokerProfileRepository(this._dio);

  final Dio _dio;

  Future<BrokerProfile> me() async {
    final response = await _dio.get<Map<String, dynamic>>('/broker-profile/me');
    return BrokerProfile.fromJson(response.data ?? <String, dynamic>{});
  }
}

final brokerProfileRepositoryProvider = Provider<BrokerProfileRepository>((
  ref,
) {
  return BrokerProfileRepository(ref.watch(dioProvider));
});

final brokerProfileProvider = FutureProvider.autoDispose<BrokerProfile>((ref) {
  return ref.watch(brokerProfileRepositoryProvider).me();
});
