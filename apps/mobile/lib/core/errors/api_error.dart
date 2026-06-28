import 'package:dio/dio.dart';

String apiErrorMessage(Object error) {
  if (error is ApiFriendlyException) {
    return error.message;
  }

  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'The API is taking too long to respond. Please check your connection and try again.';
      case DioExceptionType.connectionError:
        return 'Could not reach the API. Check your internet connection or API environment.';
      case DioExceptionType.badCertificate:
        return 'The secure connection could not be verified. Please contact support.';
      case DioExceptionType.cancel:
        return 'The request was cancelled. Please try again.';
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        break;
    }

    if (error.response?.statusCode == 401) {
      final path = error.requestOptions.path;
      if (path.endsWith('/auth/login')) {
        return 'Invalid login details.';
      }
      return 'Your session expired. Please sign in again.';
    }

    if (error.response?.statusCode == 403) {
      if (_isDealRoomPath(error.requestOptions.path)) {
        return 'You do not have access to this deal room';
      }
      return 'You do not have access to this mobile workspace.';
    }

    if (error.response?.statusCode == 404) {
      if (_isDealRoomPath(error.requestOptions.path)) {
        return 'Deal room not found';
      }
      return 'The requested mobile resource was not found.';
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

bool _isDealRoomPath(String path) {
  return path == '/deal-rooms' || path.startsWith('/deal-rooms/');
}

class ApiFriendlyException implements Exception {
  const ApiFriendlyException(this.message);

  final String message;

  @override
  String toString() => message;
}
