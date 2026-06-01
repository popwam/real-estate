String stringValue(Map<String, dynamic> json, String key, {String fallback = ''}) {
  final value = json[key];
  if (value == null) {
    return fallback;
  }
  return value.toString();
}

double? doubleValue(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '');
}

int? intValue(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '');
}
