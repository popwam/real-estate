import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'conversation_models.dart';

class ConversationsRepository {
  ConversationsRepository(this._dio);

  final Dio _dio;

  Future<List<Conversation>> conversations([
    ConversationFilters filters = const ConversationFilters(),
  ]) async {
    final response = await _dio.get<dynamic>(
      '/conversations',
      queryParameters: filters.toQuery(),
    );
    return conversationsFromResponse(response.data);
  }

  Future<Conversation> detail(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/conversations/$id');
    return Conversation.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<ConversationMessage>> messages(String id) async {
    final response = await _dio.get<List<dynamic>>(
      '/conversations/$id/messages',
    );
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ConversationMessage.fromJson)
        .toList();
  }

  Future<ConversationMessage> createMessage(String id, String body) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/conversations/$id/messages',
      data: {'body': body},
    );
    return ConversationMessage.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<Conversation> updateStatus(
    String id, {
    required String status,
    String? statusNote,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/conversations/$id/status',
      data: {
        'status': status,
        if (statusNote != null && statusNote.trim().isNotEmpty)
          'statusNote': statusNote.trim(),
      },
    );
    return Conversation.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<Conversation> byShareToken(String token) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/conversations/by-token/${Uri.encodeComponent(token)}',
    );
    return Conversation.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<PublicConversationMessageResponse>
  postPublicConversationMessageByToken(
    String token,
    PublicConversationMessagePayload payload,
  ) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/conversations/by-token/${Uri.encodeComponent(token)}/messages',
      data: payload.toJson(),
    );
    return PublicConversationMessageResponse.fromJson(
      response.data ?? <String, dynamic>{},
    );
  }
}

final conversationsRepositoryProvider = Provider<ConversationsRepository>((
  ref,
) {
  return ConversationsRepository(ref.watch(dioProvider));
});

final conversationsProvider = FutureProvider.autoDispose
    .family<List<Conversation>, ConversationFilters>((ref, filters) {
      return ref.watch(conversationsRepositoryProvider).conversations(filters);
    });

final conversationDetailProvider = FutureProvider.autoDispose
    .family<Conversation, String>((ref, id) {
      return ref.watch(conversationsRepositoryProvider).detail(id);
    });

final conversationMessagesProvider = FutureProvider.autoDispose
    .family<List<ConversationMessage>, String>((ref, id) {
      return ref.watch(conversationsRepositoryProvider).messages(id);
    });

final publicConversationProvider = FutureProvider.autoDispose
    .family<Conversation, String>((ref, token) {
      return ref.watch(conversationsRepositoryProvider).byShareToken(token);
    });
