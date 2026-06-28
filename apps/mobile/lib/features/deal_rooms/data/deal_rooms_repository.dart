import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'deal_room_models.dart';

class DealRoomsRepository {
  DealRoomsRepository(this._dio);

  final Dio _dio;

  Future<List<DealRoom>> myRooms() async {
    final response = await _dio.get<List<dynamic>>('/deal-rooms');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DealRoom.fromJson)
        .toList();
  }

  Future<DealRoom> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/deal-rooms/$id');
    return DealRoom.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<DealRoom> createFromReservation(String reservationRequestId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/deal-rooms/from-reservation/$reservationRequestId',
    );
    return DealRoom.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<void> inviteClient(String id) async {
    await _dio.post<Map<String, dynamic>>('/deal-rooms/$id/invite-client');
  }

  Future<DealRoom> updateStatus(String id, String status) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/deal-rooms/$id/status',
      data: {'status': status},
    );
    return DealRoom.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<DealRoomMessage>> messages(String id) async {
    final response = await _dio.get<List<dynamic>>('/deal-rooms/$id/messages');
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DealRoomMessage.fromJson)
        .toList();
  }

  Future<DealRoomMessage> createMessage(String id, String body) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/deal-rooms/$id/messages',
      data: {'messageType': 'TEXT', 'body': body},
    );
    return DealRoomMessage.fromJson(response.data ?? <String, dynamic>{});
  }
}

final dealRoomsRepositoryProvider = Provider<DealRoomsRepository>((ref) {
  return DealRoomsRepository(ref.watch(dioProvider));
});

final myDealRoomsProvider = FutureProvider.autoDispose<List<DealRoom>>((ref) {
  return ref.watch(dealRoomsRepositoryProvider).myRooms();
});

final dealRoomDetailProvider = FutureProvider.autoDispose
    .family<DealRoom, String>((ref, id) {
      return ref.watch(dealRoomsRepositoryProvider).detail(id);
    });

final dealRoomMessagesProvider = FutureProvider.autoDispose
    .family<List<DealRoomMessage>, String>((ref, id) {
      return ref.watch(dealRoomsRepositoryProvider).messages(id);
    });
