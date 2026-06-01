import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'marketplace_filters.dart';
import 'marketplace_models.dart';

class MarketplaceRepository {
  MarketplaceRepository(this._dio);

  final Dio _dio;

  Future<List<MarketplaceProject>> getProjects({
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    final response = await _dio.get<List<dynamic>>(
      '/marketplace/projects',
      queryParameters: filters.toProjectQuery(),
    );
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(MarketplaceProject.fromJson)
        .toList();
  }

  Future<MarketplaceProject> getProject(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/marketplace/projects/$id',
    );
    return MarketplaceProject.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<MarketplaceUnit>> getUnits({
    String? projectId,
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    final response = await _dio.get<List<dynamic>>(
      '/marketplace/units',
      queryParameters: filters.toUnitQuery(projectId: projectId),
    );
    return (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(MarketplaceUnit.fromJson)
        .toList();
  }

  Future<MarketplaceUnit> getUnit(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/marketplace/units/$id');
    return MarketplaceUnit.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<MarketplaceProject>> mapSearch({
    required double minLat,
    required double maxLat,
    required double minLng,
    required double maxLng,
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/marketplace/map-search',
      data: {
        'bbox': {
          'minLat': minLat,
          'maxLat': maxLat,
          'minLng': minLng,
          'maxLng': maxLng,
        },
        'filters': filters.toProjectQuery(),
      },
    );

    final projects = response.data?['projects'];
    if (projects is! List) {
      return const [];
    }

    return projects
        .whereType<Map<String, dynamic>>()
        .map(MarketplaceProject.fromJson)
        .toList();
  }
}

final marketplaceRepositoryProvider = Provider<MarketplaceRepository>((ref) {
  return MarketplaceRepository(ref.watch(dioProvider));
});

final marketplaceProjectsProvider =
    FutureProvider.autoDispose<List<MarketplaceProject>>((ref) {
  final filters = ref.watch(marketplaceFiltersProvider);
  return ref.watch(marketplaceRepositoryProvider).getProjects(filters: filters);
});

final marketplaceUnitsProvider =
    FutureProvider.autoDispose<List<MarketplaceUnit>>((ref) {
  final filters = ref.watch(marketplaceFiltersProvider);
  return ref.watch(marketplaceRepositoryProvider).getUnits(filters: filters);
});

final projectDetailProvider =
    FutureProvider.autoDispose.family<MarketplaceProject, String>((ref, id) {
  return ref.watch(marketplaceRepositoryProvider).getProject(id);
});

final projectUnitsProvider =
    FutureProvider.autoDispose.family<List<MarketplaceUnit>, String>((ref, id) {
  return ref.watch(marketplaceRepositoryProvider).getUnits(projectId: id);
});

final unitDetailProvider =
    FutureProvider.autoDispose.family<MarketplaceUnit, String>((ref, id) {
  return ref.watch(marketplaceRepositoryProvider).getUnit(id);
});
