import 'package:flutter_riverpod/flutter_riverpod.dart';

class MarketplaceFilters {
  const MarketplaceFilters({
    this.city,
    this.district,
    this.unitType,
    this.minPrice,
    this.maxPrice,
    this.bedrooms,
    this.areaMin,
    this.areaMax,
  });

  final String? city;
  final String? district;
  final String? unitType;
  final String? minPrice;
  final String? maxPrice;
  final String? bedrooms;
  final String? areaMin;
  final String? areaMax;

  bool get isEmpty => [
    city,
    district,
    unitType,
    minPrice,
    maxPrice,
    bedrooms,
    areaMin,
    areaMax,
  ].every((value) => value == null || value.trim().isEmpty);

  int get activeCount => [
    city,
    district,
    unitType,
    minPrice,
    maxPrice,
    bedrooms,
    areaMin,
    areaMax,
  ].where((value) => value != null && value.trim().isNotEmpty).length;

  Map<String, dynamic> toProjectQuery() {
    return _compact({
      'city': city,
      'district': district,
      'unitType': unitType,
      'minPrice': minPrice,
      'maxPrice': maxPrice,
    });
  }

  Map<String, dynamic> toUnitQuery({String? projectId}) {
    return _compact({
      'projectId': projectId,
      'city': city,
      'district': district,
      'unitType': unitType,
      'minPrice': minPrice,
      'maxPrice': maxPrice,
      'bedrooms': bedrooms,
      'areaMin': areaMin,
      'areaMax': areaMax,
    });
  }

  MarketplaceFilters copyWith({
    String? city,
    String? district,
    String? unitType,
    String? minPrice,
    String? maxPrice,
    String? bedrooms,
    String? areaMin,
    String? areaMax,
  }) {
    return MarketplaceFilters(
      city: city,
      district: district,
      unitType: unitType,
      minPrice: minPrice,
      maxPrice: maxPrice,
      bedrooms: bedrooms,
      areaMin: areaMin,
      areaMax: areaMax,
    );
  }

  static Map<String, dynamic> _compact(Map<String, dynamic> input) {
    final output = <String, dynamic>{};
    for (final entry in input.entries) {
      final value = entry.value;
      if (value != null && value.toString().trim().isNotEmpty) {
        output[entry.key] = value.toString().trim();
      }
    }
    return output;
  }
}

class MarketplaceFiltersController extends Notifier<MarketplaceFilters> {
  @override
  MarketplaceFilters build() => const MarketplaceFilters();

  void setFilters(MarketplaceFilters filters) {
    state = filters;
  }

  void clear() {
    state = const MarketplaceFilters();
  }
}

final marketplaceFiltersProvider =
    NotifierProvider<MarketplaceFiltersController, MarketplaceFilters>(
      MarketplaceFiltersController.new,
    );
