import 'package:intl/intl.dart';

String shortDate(String? value) {
  return shortDateForLocale(value);
}

String shortDateForLocale(String? value, {String? locale}) {
  if (value == null || value.isEmpty) {
    return '-';
  }

  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    return value;
  }

  final local = parsed.toLocal();
  return DateFormat.yMMMd(locale).format(local);
}

String shortDateTime(String? value) {
  return shortDateTimeForLocale(value);
}

String shortDateTimeForLocale(String? value, {String? locale}) {
  if (value == null || value.isEmpty) {
    return '-';
  }

  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    return value;
  }

  final local = parsed.toLocal();
  return DateFormat.yMMMd(locale).add_jm().format(local);
}
