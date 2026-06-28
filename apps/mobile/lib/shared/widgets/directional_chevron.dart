import 'package:flutter/material.dart';

class DirectionalChevron extends StatelessWidget {
  const DirectionalChevron({super.key});

  @override
  Widget build(BuildContext context) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    return Icon(isRtl ? Icons.chevron_left : Icons.chevron_right);
  }
}
