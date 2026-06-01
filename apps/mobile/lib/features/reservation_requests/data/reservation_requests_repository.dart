import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'reservation_request_models.dart';

class ReservationRequestsRepository {
  ReservationRequestsRepository(this._dio);

  final Dio _dio;

  Future<ReservationRequest> create({
    required String leadClaimId,
    String? unitId,
    String? notes,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/reservation-requests',
      data: {
        'leadClaimId': leadClaimId,
        if (unitId != null && unitId.isNotEmpty) 'unitId': unitId,
        if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
      },
    );
    return ReservationRequest.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<ReservationRequest>> myRequests() async {
    final response = await _dio.get<List<dynamic>>('/reservation-requests');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ReservationRequest.fromJson)
        .toList();
  }

  Future<ReservationRequest> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/reservation-requests/$id',
    );
    return ReservationRequest.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<ReservationRequest> cancel(String id) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/reservation-requests/$id/cancel',
    );
    return ReservationRequest.fromJson(response.data ?? <String, dynamic>{});
  }
}

final reservationRequestsRepositoryProvider =
    Provider<ReservationRequestsRepository>((ref) {
  return ReservationRequestsRepository(ref.watch(dioProvider));
});

final myReservationRequestsProvider =
    FutureProvider.autoDispose<List<ReservationRequest>>((ref) {
  return ref.watch(reservationRequestsRepositoryProvider).myRequests();
});

final reservationRequestDetailProvider =
    FutureProvider.autoDispose.family<ReservationRequest, String>((ref, id) {
  return ref.watch(reservationRequestsRepositoryProvider).detail(id);
});
