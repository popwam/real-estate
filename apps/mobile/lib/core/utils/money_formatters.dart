String moneyLabel(num? amount, {String? currency}) {
  if (amount == null) {
    return 'Amount pending';
  }

  final hasFraction = amount % 1 != 0;
  final value = amount.toStringAsFixed(hasFraction ? 2 : 0);
  return '${currency ?? 'EGP'} $value';
}
