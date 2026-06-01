import 'package:dio/dio.dart';

String apiErrorMessage(Object error) {
  if (error is DioException) {
    if (error.response?.statusCode == 401) {
      return 'Your session expired. Log out and sign in again.';
    }
    final data = error.response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    if (data is Map && data['message'] is List) {
      return (data['message'] as List).join(', ');
    }
    return error.message ?? 'Request failed';
  }

  return error.toString();
}
