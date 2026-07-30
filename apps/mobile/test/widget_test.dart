import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile/app.dart';
import 'package:mobile/core/storage/secure_token_storage.dart';
import 'package:mobile/features/auth/data/auth_models.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/attendance/data/attendance_models.dart';
import 'package:mobile/features/attendance/data/attendance_repository.dart';
import 'package:mobile/features/attendance/services/attendance_evidence_collector.dart';
import 'package:mobile/features/attendance/services/attendance_evidence_models.dart';
import 'package:mobile/features/attendance/services/attendance_location_service.dart';
import 'package:mobile/features/marketplace/data/marketplace_filters.dart';
import 'package:mobile/features/marketplace/data/marketplace_models.dart';
import 'package:mobile/features/marketplace/data/marketplace_repository.dart';

void main() {
  testWidgets('signed-out app opens marketplace, not forced login', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
    expect(find.text('No visible projects'), findsOneWidget);
    expect(find.text('Email or phone'), findsNothing);
  });

  testWidgets('login screen has Continue as guest', (tester) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    expect(find.text('Email or phone'), findsOneWidget);
    expect(find.text('Continue as guest'), findsOneWidget);

    await tester.tap(find.text('Continue as guest'));
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
  });

  testWidgets('successful login routes according to mocked role', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          loginSession: _session(
            role: 'DEVELOPER_ADMIN',
            permissions: const ['crm.leads.view_own'],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).first, 'dev@example.com');
    await tester.enterText(find.byType(TextFormField).last, 'password');
    await tester.tap(find.text('Sign in').last);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('CRM leads'), findsWidgets);
  });

  testWidgets('logout returns to marketplace', (tester) async {
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Logout'));
    await tester.drag(find.byType(ListView), const Offset(0, -220));
    await tester.pumpAndSettle();
    await tester.tap(
      find.ancestor(
        of: find.text('Logout'),
        matching: find.byType(FilledButton),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
    expect(find.text('No visible projects'), findsOneWidget);
  });

  testWidgets('restores Arabic locale and keeps public marketplace usable', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    tester.platformDispatcher.textScaleFactorTestValue = 1.4;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });

    await tester.pumpWidget(
      _testApp(tokenStorage: _FakeTokenStorage(localeCode: 'ar')),
    );
    await tester.pumpAndSettle();

    final directionality = tester.widget<Directionality>(
      find
          .ancestor(
            of: find.byType(NavigationBar),
            matching: find.byType(Directionality),
          )
          .last,
    );

    expect(directionality.textDirection, TextDirection.rtl);
    expect(tester.takeException(), isNull);
  });

  testWidgets('attendance screen checks in and checks out linked employee', (
    tester,
  ) async {
    final attendanceRepository = _FakeAttendanceRepository();
    final evidenceCollector = _FakeAttendanceEvidenceCollector();

    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
        attendanceRepository: attendanceRepository,
        evidenceCollector: evidenceCollector,
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Attendance'));
    await tester.tap(find.text('Attendance'));
    await tester.pumpAndSettle();

    expect(find.text('Check in'), findsOneWidget);

    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();

    expect(attendanceRepository.checkInCount, 1);
    expect(evidenceCollector.collectCount, 1);
    expect(attendanceRepository.lastPayload?.deviceId, 'test-device');
    expect(attendanceRepository.lastPayload?.photoFileId, 'photo_file_1');
    expect(find.text('Check out'), findsOneWidget);

    await tester.ensureVisible(find.text('Check out'));
    await tester.drag(find.byType(ListView), const Offset(0, -220));
    await tester.pumpAndSettle();
    await tester.tap(
      find.ancestor(
        of: find.text('Check out'),
        matching: find.byType(FilledButton),
      ),
    );
    await tester.pumpAndSettle();

    expect(attendanceRepository.checkOutCount, 1);
    expect(evidenceCollector.collectCount, 2);
    expect(find.text('Attendance completed today'), findsOneWidget);
  });

  testWidgets('attendance screen does not call API when photo upload fails', (
    tester,
  ) async {
    final attendanceRepository = _FakeAttendanceRepository();
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
        attendanceRepository: attendanceRepository,
        evidenceCollector: _FailingAttendanceEvidenceCollector(
          AttendanceEvidenceIssue.photoUploadFailed,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Attendance'));
    await tester.tap(find.text('Attendance'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();

    expect(attendanceRepository.checkInCount, 0);
    expect(find.text('Evidence warnings'), findsOneWidget);
    expect(
      find.textContaining('Live photo upload failed. Please try again.'),
      findsOneWidget,
    );
  });

  testWidgets('attendance screen shows native evidence warnings', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
        attendanceRepository: _FakeAttendanceRepository(),
        evidenceCollector: _FakeAttendanceEvidenceCollector(
          issues: const [
            AttendanceEvidenceIssue.locationPermissionDenied,
            AttendanceEvidenceIssue.cameraPermissionDenied,
            AttendanceEvidenceIssue.photoUploadFailed,
            AttendanceEvidenceIssue.wifiUnavailable,
            AttendanceEvidenceIssue.developerOptionsEnabled,
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Attendance'));
    await tester.tap(find.text('Attendance'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Check in'));
    await tester.pumpAndSettle();

    expect(find.text('Evidence warnings'), findsOneWidget);
    expect(
      find.textContaining('Location permission was denied.'),
      findsOneWidget,
    );
    expect(
      find.textContaining('Camera permission was denied.'),
      findsOneWidget,
    );
    expect(
      find.textContaining('Live photo upload failed. Please try again.'),
      findsOneWidget,
    );
    expect(
      find.textContaining('The phone is not connected to Wi-Fi.'),
      findsOneWidget,
    );
    expect(
      find.textContaining('Developer options are enabled.'),
      findsOneWidget,
    );
  });

  testWidgets('attendance screen shows no linked employee message', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
        attendanceRepository: _FakeAttendanceRepository(noLinkedEmployee: true),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Attendance'));
    await tester.tap(find.text('Attendance'));
    await tester.pumpAndSettle();

    expect(
      find.text('No employee profile is linked to this account.'),
      findsOneWidget,
    );
  });

  testWidgets('attendance Arabic labels render', (tester) async {
    await tester.pumpWidget(
      _testApp(
        tokenStorage: _FakeTokenStorage(localeCode: 'ar'),
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
        attendanceRepository: _FakeAttendanceRepository(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.person_outline));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('الحضور'));
    await tester.tap(find.text('الحضور'));
    await tester.pumpAndSettle();

    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('attendance French labels render', (tester) async {
    await tester.pumpWidget(
      _testApp(
        tokenStorage: _FakeTokenStorage(localeCode: 'fr'),
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
        attendanceRepository: _FakeAttendanceRepository(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.person_outline));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Présence'));
    await tester.tap(find.text('Présence'));
    await tester.pumpAndSettle();

    expect(find.text("Pointer l'arrivée"), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

Widget _testApp({
  SecureTokenStorage? tokenStorage,
  AuthRepository? authRepository,
  AttendanceRepository? attendanceRepository,
  AttendanceEvidenceCollector? evidenceCollector,
  AttendanceLocationService? attendanceLocationService,
}) {
  final storage = tokenStorage ?? _FakeTokenStorage();
  return ProviderScope(
    overrides: [
      secureTokenStorageProvider.overrideWithValue(storage),
      authRepositoryProvider.overrideWithValue(
        authRepository ?? _FakeAuthRepository(),
      ),
      marketplaceRepositoryProvider.overrideWithValue(
        _FakeMarketplaceRepository(),
      ),
      attendanceRepositoryProvider.overrideWithValue(
        attendanceRepository ?? _FakeAttendanceRepository(),
      ),
      attendanceEvidenceCollectorProvider.overrideWithValue(
        evidenceCollector ?? _FakeAttendanceEvidenceCollector(),
      ),
      attendanceLocationServiceProvider.overrideWithValue(
        attendanceLocationService ?? _FakeAttendanceLocationService(),
      ),
    ],
    child: const PopwamMobileApp(),
  );
}

class _FakeAttendanceRepository implements AttendanceRepository {
  _FakeAttendanceRepository({this.noLinkedEmployee = false});

  final bool noLinkedEmployee;
  int checkInCount = 0;
  int checkOutCount = 0;
  AttendanceVerificationPayload? lastPayload;
  AttendanceRecord _today = const AttendanceRecord(
    id: null,
    date: '2026-07-01',
    employeeId: 'employee_1',
    status: null,
    canCheckIn: true,
    canCheckOut: false,
  );

  @override
  Future<AttendanceRecord> checkIn({
    String? note,
    AttendanceVerificationPayload payload =
        const AttendanceVerificationPayload(),
  }) async {
    checkInCount++;
    lastPayload = payload;
    _today = const AttendanceRecord(
      id: 'attendance_1',
      date: '2026-07-01',
      employeeId: 'employee_1',
      checkInAt: '2026-07-01T08:00:00.000Z',
      status: 'PRESENT',
      verificationStatus: 'VERIFIED',
      dvrVerificationStatus: 'NOT_REQUIRED',
      canCheckIn: false,
      canCheckOut: true,
    );
    return _today;
  }

  @override
  Future<AttendanceRecord> checkOut({
    String? note,
    AttendanceVerificationPayload payload =
        const AttendanceVerificationPayload(),
  }) async {
    checkOutCount++;
    lastPayload = payload;
    _today = const AttendanceRecord(
      id: 'attendance_1',
      date: '2026-07-01',
      employeeId: 'employee_1',
      checkInAt: '2026-07-01T08:00:00.000Z',
      checkOutAt: '2026-07-01T16:00:00.000Z',
      status: 'PRESENT',
      verificationStatus: 'VERIFIED',
      dvrVerificationStatus: 'NOT_REQUIRED',
      canCheckIn: false,
      canCheckOut: false,
      durationMinutes: 480,
    );
    return _today;
  }

  @override
  Future<List<AttendanceRecord>> history() async {
    return _today.id == null ? const [] : [_today];
  }

  @override
  Future<AttendanceRecord> today() async {
    if (noLinkedEmployee) {
      throw DioException(
        requestOptions: RequestOptions(path: '/hr/attendance/me/today'),
        response: Response(
          requestOptions: RequestOptions(path: '/hr/attendance/me/today'),
          statusCode: 403,
          data: const {
            'message': 'No employee profile is linked to this account.',
          },
        ),
      );
    }
    return _today;
  }

  @override
  Future<AttendancePreflight> checkInPreflight(AttendanceVerificationPayload payload) async {
    return const AttendancePreflight(allowed: true);
  }
}

class _FakeAttendanceLocationService extends AttendanceLocationService {
  @override
  Future<AttendanceLocationEvidence> collect() async => AttendanceLocationEvidence(
    latitude: 30.0444,
    longitude: 31.2357,
    accuracyMeters: 5,
    capturedAt: DateTime.now(),
  );
}

class _FakeAttendanceEvidenceCollector implements AttendanceEvidenceCollector {
  _FakeAttendanceEvidenceCollector({this.issues = const []});

  final List<AttendanceEvidenceIssue> issues;
  int collectCount = 0;

  @override
  Future<AttendanceEvidenceResult> collect(
    BuildContext context, {
    required String purpose,
    AttendanceLocationEvidence? locationEvidence,
  }) async {
    collectCount++;
    return AttendanceEvidenceResult(
      payload: const AttendanceVerificationPayload(
        latitude: 30.0444,
        longitude: 31.2357,
        wifiSsid: 'Company-WiFi',
        wifiBssid: 'AA:BB:CC:DD:EE:FF',
        deviceId: 'test-device',
        developerOptionsEnabled: false,
        usbDebuggingEnabled: false,
        photoFileId: 'photo_file_1',
      ),
      issues: issues,
    );
  }
}

class _FailingAttendanceEvidenceCollector
    implements AttendanceEvidenceCollector {
  _FailingAttendanceEvidenceCollector(this.issue);

  final AttendanceEvidenceIssue issue;

  @override
  Future<AttendanceEvidenceResult> collect(
    BuildContext context, {
    required String purpose,
    AttendanceLocationEvidence? locationEvidence,
  }) async {
    throw AttendanceEvidenceException(issue);
  }
}

AuthSession _session({
  required String role,
  List<String> permissions = const [],
}) {
  return AuthSession(
    user: AuthUser(
      id: 'user_1',
      email: 'demo@example.com',
      role: role,
      firstName: 'Demo',
      lastName: 'User',
    ),
    organization: const AuthOrganization(
      id: 'org_1',
      name: 'Demo Organization',
      type: 'BROKERAGE',
      status: 'ACTIVE',
    ),
    permissions: permissions,
  );
}

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.storedSession, this.loginSession});

  final AuthSession? storedSession;
  final AuthSession? loginSession;

  @override
  Future<void> clearTokens() async {}

  @override
  Future<bool> hasStoredSession() async => storedSession != null;

  @override
  Future<AuthSession> login({
    required String identifier,
    required String password,
  }) async {
    return loginSession ?? _session(role: 'CLIENT');
  }

  @override
  Future<void> logout() async {}

  @override
  Future<AuthSession> me() async {
    return storedSession ?? _session(role: 'CLIENT');
  }
}

class _FakeMarketplaceRepository implements MarketplaceRepository {
  @override
  Future<MarketplaceProject> getProject(String id) async {
    return const MarketplaceProject(
      id: 'project_1',
      name: 'Demo Project',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    );
  }

  @override
  Future<List<MarketplaceProject>> getProjects({
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    return const [];
  }

  @override
  Future<MarketplaceUnit> getUnit(String id) async {
    return const MarketplaceUnit(
      id: 'unit_1',
      status: 'AVAILABLE',
      visibility: 'PUBLIC',
    );
  }

  @override
  Future<List<MarketplaceUnit>> getUnits({
    String? projectId,
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    return const [];
  }

  @override
  Future<List<MarketplaceProject>> mapSearch({
    required double minLat,
    required double maxLat,
    required double minLng,
    required double maxLng,
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    return const [];
  }
}

class _FakeTokenStorage extends SecureTokenStorage {
  _FakeTokenStorage({this.localeCode}) : super(const FlutterSecureStorage());

  String? localeCode;

  @override
  Future<TokenPair?> readTokens() async => null;

  @override
  Future<String?> readAccessToken() async => null;

  @override
  Future<String?> readRefreshToken() async => null;

  @override
  Future<void> saveTokens(TokenPair tokens) async {}

  @override
  Future<void> clearTokens() async {}

  @override
  Future<String?> readLocaleCode() async => localeCode;

  @override
  Future<void> saveLocaleCode(String localeCode) async {
    this.localeCode = localeCode;
  }

  @override
  Future<String?> readDeviceId() async => null;

  @override
  Future<void> saveDeviceId(String deviceId) async {}
}
