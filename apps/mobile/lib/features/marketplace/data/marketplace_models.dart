import '../../../shared/models/json_helpers.dart';

class MarketplaceProject {
  const MarketplaceProject({
    required this.id,
    required this.name,
    required this.status,
    required this.visibility,
    this.city,
    this.district,
    this.type,
    this.description,
    this.latitude,
    this.longitude,
    this.developerName,
    this.availableUnits,
    this.coverImageUrl,
    this.startingPrice,
    this.currency,
    this.paymentPlans = const [],
  });

  final String id;
  final String name;
  final String status;
  final String visibility;
  final String? city;
  final String? district;
  final String? type;
  final String? description;
  final double? latitude;
  final double? longitude;
  final String? developerName;
  final int? availableUnits;
  final String? coverImageUrl;
  final double? startingPrice;
  final String? currency;
  final List<MarketplacePaymentPlan> paymentPlans;

  String get locationLabel {
    final parts = [
      district,
      city,
    ].whereType<String>().where((v) => v.isNotEmpty);
    return parts.isEmpty ? 'Location pending' : parts.join(', ');
  }

  String get startingPriceLabel {
    if (startingPrice == null) {
      return 'Price on request';
    }
    final value = startingPrice!.toStringAsFixed(
      startingPrice! % 1 == 0 ? 0 : 2,
    );
    return currency == null || currency!.isEmpty
        ? 'From $value'
        : 'From $currency $value';
  }

  factory MarketplaceProject.fromJson(Map<String, dynamic> json) {
    final developer = json['developer'];
    final inventoryUnits = json['inventoryUnits'];
    final units = inventoryUnits is List
        ? inventoryUnits.whereType<Map<String, dynamic>>().toList()
        : const <Map<String, dynamic>>[];
    final unitPrices = units
        .map((unit) => doubleValue(unit, 'basePrice'))
        .whereType<double>()
        .toList();
    unitPrices.sort();

    return MarketplaceProject(
      id: stringValue(json, 'id'),
      name: stringValue(json, 'name', fallback: 'Untitled project'),
      status: stringValue(json, 'status'),
      visibility: stringValue(json, 'visibility'),
      city: json['city']?.toString(),
      district: json['district']?.toString(),
      type: json['type']?.toString(),
      description: json['description']?.toString(),
      latitude: doubleValue(json, 'latitude'),
      longitude: doubleValue(json, 'longitude'),
      developerName: developer is Map<String, dynamic>
          ? developer['name']?.toString()
          : null,
      availableUnits: units.isNotEmpty
          ? units.length
          : intValue(json, 'availableUnits'),
      coverImageUrl: _firstImageUrl(json),
      startingPrice:
          doubleValue(json, 'startingPrice') ??
          (unitPrices.isNotEmpty ? unitPrices.first : null),
      currency:
          json['currency']?.toString() ??
          (units.isNotEmpty ? units.first['currency']?.toString() : null),
      paymentPlans: _paymentPlans(json['paymentPlans']),
    );
  }
}

class MarketplaceUnit {
  const MarketplaceUnit({
    required this.id,
    required this.status,
    required this.visibility,
    this.unitCode,
    this.unitType,
    this.basePrice,
    this.currency,
    this.bedrooms,
    this.bathrooms,
    this.areaSqm,
    this.floor,
    this.project,
    this.paymentPlans = const [],
  });

  final String id;
  final String status;
  final String visibility;
  final String? unitCode;
  final String? unitType;
  final double? basePrice;
  final String? currency;
  final int? bedrooms;
  final int? bathrooms;
  final double? areaSqm;
  final int? floor;
  final MarketplaceProject? project;
  final List<MarketplacePaymentPlan> paymentPlans;

  String get title => unitCode?.isNotEmpty == true ? unitCode! : 'Unit $id';

  String get priceLabel {
    if (basePrice == null) {
      return 'Price on request';
    }
    final value = basePrice!.toStringAsFixed(basePrice! % 1 == 0 ? 0 : 2);
    return currency == null || currency!.isEmpty ? value : '$currency $value';
  }

  factory MarketplaceUnit.fromJson(Map<String, dynamic> json) {
    final project = json['project'];

    return MarketplaceUnit(
      id: stringValue(json, 'id'),
      status: stringValue(json, 'status'),
      visibility: stringValue(json, 'visibility'),
      unitCode: json['unitCode']?.toString() ?? json['code']?.toString(),
      unitType: json['unitType']?.toString(),
      basePrice: doubleValue(json, 'basePrice'),
      currency: json['currency']?.toString(),
      bedrooms: intValue(json, 'bedrooms'),
      bathrooms: intValue(json, 'bathrooms'),
      areaSqm: doubleValue(json, 'areaSqm'),
      floor: intValue(json, 'floor'),
      project: project is Map<String, dynamic>
          ? MarketplaceProject.fromJson(project)
          : null,
      paymentPlans: _paymentPlans(json['paymentPlans']),
    );
  }
}

class MarketplacePaymentPlan {
  const MarketplacePaymentPlan({
    required this.label,
    this.downPaymentPercent,
    this.installments,
    this.years,
  });

  final String label;
  final double? downPaymentPercent;
  final int? installments;
  final int? years;

  factory MarketplacePaymentPlan.fromJson(Map<String, dynamic> json) {
    return MarketplacePaymentPlan(
      label: stringValue(
        json,
        'name',
        fallback: stringValue(json, 'label', fallback: 'Payment plan'),
      ),
      downPaymentPercent: doubleValue(json, 'downPaymentPercent'),
      installments: intValue(json, 'installments'),
      years: intValue(json, 'years'),
    );
  }
}

String? _firstImageUrl(Map<String, dynamic> json) {
  final direct = json['coverImageUrl'] ?? json['coverUrl'] ?? json['imageUrl'];
  if (direct != null && direct.toString().isNotEmpty) {
    return direct.toString();
  }

  final images = json['images'];
  if (images is List && images.isNotEmpty) {
    final first = images.first;
    if (first is String) {
      return first;
    }
    if (first is Map<String, dynamic>) {
      return first['url']?.toString();
    }
  }

  return null;
}

List<MarketplacePaymentPlan> _paymentPlans(Object? value) {
  if (value is! List) {
    return const [];
  }
  return value
      .whereType<Map<String, dynamic>>()
      .map(MarketplacePaymentPlan.fromJson)
      .toList();
}
