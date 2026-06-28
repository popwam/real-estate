import 'package:intl/intl.dart';

String moneyLabel(num? amount, {String? currency}) {
  return moneyLabelForLocale(amount, currency: currency);
}

String moneyLabelForLocale(num? amount, {String? currency, String? locale}) {
  if (amount == null) {
    return 'Amount pending';
  }

  final hasFraction = amount % 1 != 0;
  final decimalDigits = hasFraction ? 2 : 0;
  if (currency == null || currency.isEmpty) {
    final format = NumberFormat.decimalPattern(locale)
      ..minimumFractionDigits = decimalDigits
      ..maximumFractionDigits = decimalDigits;
    return format.format(amount);
  }

  return NumberFormat.currency(
    locale: locale,
    name: currency,
    symbol: currency,
    decimalDigits: decimalDigits,
  ).format(amount);
}
