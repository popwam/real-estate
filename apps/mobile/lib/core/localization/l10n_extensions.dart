import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../l10n/app_localizations.dart';
import '../errors/api_error.dart';

extension L10nBuildContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);

  String get localeName => Localizations.localeOf(this).toLanguageTag();

  String formatShortDate(String? value) {
    final parsed = _parseDate(value);
    if (parsed == null) {
      return value?.isNotEmpty == true ? value! : '-';
    }

    return MaterialLocalizations.of(this).formatShortDate(parsed.toLocal());
  }

  String formatShortDateTime(String? value) {
    final parsed = _parseDate(value);
    if (parsed == null) {
      return value?.isNotEmpty == true ? value! : '-';
    }

    final local = parsed.toLocal();
    final material = MaterialLocalizations.of(this);
    return '${material.formatShortDate(local)} ${material.formatTimeOfDay(TimeOfDay.fromDateTime(local))}';
  }

  String formatNumber(num value, {int? decimalDigits}) {
    final format = NumberFormat.decimalPattern(localeName);
    if (decimalDigits != null) {
      format
        ..minimumFractionDigits = decimalDigits
        ..maximumFractionDigits = decimalDigits;
    }
    return format.format(value);
  }

  String formatMoney(num? amount, {String? currency}) {
    if (amount == null) {
      return l10n.amountPending;
    }

    final hasFraction = amount % 1 != 0;
    final digits = hasFraction ? 2 : 0;
    if (currency == null || currency.isEmpty) {
      return formatNumber(amount, decimalDigits: digits);
    }

    return NumberFormat.currency(
      locale: localeName,
      name: currency,
      symbol: currency,
      decimalDigits: digits,
    ).format(amount);
  }

  String formatApiError(Object error) {
    final raw = apiErrorMessage(error);

    if (error is DioException) {
      final responseData = error.response?.data;
      final responseCode = responseData is Map ? responseData['code'] : null;
      if (responseCode == 'EMPLOYEE_PROFILE_NOT_LINKED') {
        return l10n.noEmployeeProfileLinked;
      }
      if (responseCode == 'COMPANY_AWAITING_VERIFICATION') {
        return l10n.companyAwaitingVerification;
      }

      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return l10n.requestTimedOut;
        case DioExceptionType.connectionError:
          return l10n.couldNotReachApi;
        case DioExceptionType.badCertificate:
          return l10n.secureConnectionError;
        case DioExceptionType.cancel:
          return l10n.requestCancelled;
        case DioExceptionType.badResponse:
        case DioExceptionType.unknown:
          break;
      }

      if (error.response?.statusCode == 401) {
        return error.requestOptions.path.endsWith('/auth/login')
            ? l10n.invalidLoginDetails
            : l10n.sessionExpired;
      }
      if (_isDealRoomPath(error.requestOptions.path) &&
          error.response?.statusCode == 403) {
        return l10n.dealRoomAccessDenied;
      }
      if (_isDealRoomPath(error.requestOptions.path) &&
          error.response?.statusCode == 404) {
        return l10n.dealRoomNotFound;
      }
      if (error.response?.statusCode == 403) {
        return l10n.workspaceAccessDenied;
      }
      if (error.response?.statusCode == 404) {
        return l10n.mobileResourceNotFound;
      }
    }

    return switch (raw) {
      'Invalid login details.' => l10n.invalidLoginDetails,
      'Your session expired. Please sign in again.' => l10n.sessionExpired,
      'You do not have access to this mobile workspace.' =>
        l10n.workspaceAccessDenied,
      'The requested mobile resource was not found.' =>
        l10n.mobileResourceNotFound,
      'You do not have access to this deal room' => l10n.dealRoomAccessDenied,
      'Deal room not found' => l10n.dealRoomNotFound,
      'No employee profile is linked to this account.' =>
        l10n.noEmployeeProfileLinked,
      'You are already checked in.' => l10n.alreadyCheckedIn,
      'You must check in before checking out.' => l10n.checkInBeforeCheckOut,
      'Attendance verification failed.' => l10n.attendanceVerificationFailed,
      'Attendance photo is too large.' => l10n.attendancePhotoTooLarge,
      'Attendance photo must be a JPEG, PNG, or WebP image.' =>
        l10n.attendanceInvalidPhotoType,
      'Attendance photo extension does not match the image type.' =>
        l10n.attendanceInvalidPhotoType,
      'Request failed' => l10n.requestFailed,
      _ => raw,
    };
  }

  String localizedAttendanceFailure(String reason) {
    return switch (reason) {
      'DEVELOPER_OPTIONS_ENABLED' => l10n.developerOptionsEnabled,
      'USB_DEBUGGING_ENABLED' => l10n.usbDebuggingEnabled,
      'LOCATION_REQUIRED' => l10n.attendanceLocationRequired,
      'LOCATION_POLICY_NOT_CONFIGURED' => l10n.attendanceLocationPolicyMissing,
      'OUTSIDE_ALLOWED_LOCATION' => l10n.outsideAllowedLocation,
      'WIFI_REQUIRED' => l10n.attendanceWifiRequired,
      'WIFI_NOT_ALLOWED' => l10n.notConnectedToCompanyWifi,
      'PHOTO_REQUIRED' => l10n.attendancePhotoRequired,
      'PHOTO_FILE_NOT_FOUND' => l10n.attendancePhotoRejected,
      'PHOTO_FILE_NOT_OWNED_BY_USER' => l10n.attendancePhotoRejected,
      'PHOTO_FILE_NOT_IN_ORGANIZATION' => l10n.attendancePhotoRejected,
      'PHOTO_FILE_NOT_ATTENDANCE_EVIDENCE' => l10n.attendancePhotoRejected,
      'PHOTO_FILE_TOO_OLD' => l10n.attendancePhotoRejected,
      'PHOTO_FILE_INVALID_TYPE' => l10n.attendanceInvalidPhotoType,
      _ => reason,
    };
  }
}

bool _isDealRoomPath(String path) {
  return path == '/deal-rooms' || path.startsWith('/deal-rooms/');
}

DateTime? _parseDate(String? value) {
  if (value == null || value.isEmpty) {
    return null;
  }
  return DateTime.tryParse(value);
}
