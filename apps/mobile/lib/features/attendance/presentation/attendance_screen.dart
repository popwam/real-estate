import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../data/attendance_models.dart';
import '../data/attendance_repository.dart';
import '../services/attendance_evidence_collector.dart';
import '../services/attendance_evidence_models.dart';
import '../services/attendance_location_service.dart';

enum _AttendanceFlowState { idle, requestingLocation, fetchingLocation, validatingLocation, openingCamera, uploadingPhoto, submitting, success, failure }

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  bool _isSubmitting = false;
  Object? _actionError;
  List<AttendanceEvidenceIssue> _evidenceIssues = const [];
  _AttendanceFlowState _flowState = _AttendanceFlowState.idle;

  Future<void> _refresh() async {
    ref.invalidate(attendanceTodayProvider);
    ref.invalidate(attendanceHistoryProvider);
    await Future.wait([
      ref.read(attendanceTodayProvider.future),
      ref.read(attendanceHistoryProvider.future),
    ]);
  }

  Future<void> _submit(bool checkIn) async {
    setState(() {
      _isSubmitting = true;
      _actionError = null;
      _evidenceIssues = const [];
      _flowState = _AttendanceFlowState.requestingLocation;
    });

    try {
      // Every attempt obtains a new native location before camera/upload.
      if (mounted) setState(() => _flowState = _AttendanceFlowState.fetchingLocation);
      final location = await ref.read(attendanceLocationServiceProvider).collect();
      if (!mounted) return;
      final locationPayload = AttendanceVerificationPayload(
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracyMeters: location.accuracyMeters,
        locationCapturedAt: location.capturedAt,
      );
      setState(() => _flowState = _AttendanceFlowState.validatingLocation);
      final repository = ref.read(attendanceRepositoryProvider);
      final preflight = checkIn
          ? await repository.checkInPreflight(locationPayload)
          : await repository.checkOutPreflight(locationPayload);
      if (!mounted) return;
      if (!preflight.allowed) {
        setState(() {
          _actionError = _AttendancePreflightException(preflight.blockingReasons);
          _flowState = _AttendanceFlowState.failure;
        });
        return;
      }
      setState(() => _flowState = _AttendanceFlowState.openingCamera);
      final evidence = await ref
          .read(attendanceEvidenceCollectorProvider)
          .collect(
            context,
            purpose: checkIn ? 'ATTENDANCE_CHECK_IN' : 'ATTENDANCE_CHECK_OUT',
            locationEvidence: location,
          );
      if (!mounted) return;
      setState(() => _flowState = _AttendanceFlowState.uploadingPhoto);
      setState(() => _flowState = _AttendanceFlowState.submitting);
      if (checkIn) {
        await repository.checkIn(payload: evidence.payload);
      } else {
        await repository.checkOut(
          attendanceRecordId:
              ref.read(attendanceTodayProvider).asData?.value.id,
          payload: evidence.payload,
        );
      }
      setState(() => _evidenceIssues = evidence.issues);
      await _refresh();
      if (mounted) setState(() => _flowState = _AttendanceFlowState.success);
    } on AttendanceException catch (error) {
      await _refresh();
      if (mounted) setState(() => _actionError = error);
    } on DioException catch (error) {
      setState(() => _actionError = error);
    } on AttendanceEvidenceException catch (error) {
      setState(() => _evidenceIssues = [error.issue]);
    } catch (error) {
      setState(() => _actionError = error);
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          if (_flowState != _AttendanceFlowState.success) _flowState = _AttendanceFlowState.idle;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final today = ref.watch(attendanceTodayProvider);
    final history = ref.watch(attendanceHistoryProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.attendance),
        actions: [
          IconButton(
            tooltip: l10n.refreshAttendance,
            onPressed: () => _refresh(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: today.when(
        data: (record) => RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _TodayAttendanceCard(
                record: record,
                isSubmitting: _isSubmitting,
                actionError: _actionError,
                evidenceIssues: _evidenceIssues,
                flowState: _flowState,
                onCheckIn: () => _submit(true),
                onCheckOut: () => _submit(false),
              ),
              const SizedBox(height: 16),
              Text(
                l10n.attendanceHistory,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              history.when(
                data: (records) => records.isEmpty
                    ? EmptyState(
                        title: l10n.noAttendanceHistory,
                        message: l10n.attendanceHistoryAppearsHere,
                        icon: Icons.history,
                      )
                    : Column(
                        children: records
                            .map(
                              (item) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _AttendanceHistoryTile(record: item),
                              ),
                            )
                            .toList(),
                      ),
                error: (error, _) => EmptyState(
                  title: l10n.attendanceUnavailable,
                  message: context.formatApiError(error),
                  icon: Icons.cloud_off_outlined,
                  action: OutlinedButton.icon(
                    onPressed: () => ref.invalidate(attendanceHistoryProvider),
                    icon: const Icon(Icons.refresh),
                    label: Text(l10n.retry),
                  ),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
              ),
            ],
          ),
        ),
        error: (error, _) {
          if (_isNoLinkedEmployeeError(error)) {
            return EmptyState(
              title: l10n.attendanceUnavailable,
              message: l10n.noEmployeeProfileLinked,
              icon: Icons.badge_outlined,
              action: OutlinedButton.icon(
                onPressed: () => _refresh(),
                icon: const Icon(Icons.refresh),
                label: Text(l10n.retry),
              ),
            );
          }
          return EmptyState(
            title: l10n.attendanceUnavailable,
            message: context.formatApiError(error),
            icon: Icons.cloud_off_outlined,
            action: OutlinedButton.icon(
              onPressed: () => _refresh(),
              icon: const Icon(Icons.refresh),
              label: Text(l10n.retry),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _TodayAttendanceCard extends StatelessWidget {
  const _TodayAttendanceCard({
    required this.record,
    required this.isSubmitting,
    required this.actionError,
    required this.evidenceIssues,
    required this.flowState,
    required this.onCheckIn,
    required this.onCheckOut,
  });

  final AttendanceRecord record;
  final bool isSubmitting;
  final Object? actionError;
  final List<AttendanceEvidenceIssue> evidenceIssues;
  final _AttendanceFlowState flowState;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.attendanceToday,
                    style: theme.textTheme.titleLarge,
                  ),
                ),
                if (record.status != null) StatusChip(label: record.status!),
              ],
            ),
            const SizedBox(height: 16),
            _AttendanceRow(
              label: l10n.attendanceDate,
              value: record.date.isEmpty ? '-' : record.date,
            ),
            _AttendanceRow(
              label: l10n.checkInTime,
              value: context.formatShortDateTime(record.checkInAt),
            ),
            _AttendanceRow(
              label: l10n.checkOutTime,
              value: context.formatShortDateTime(record.checkOutAt),
            ),
            _AttendanceRow(
              label: l10n.attendanceDuration,
              value: record.durationMinutes == null
                  ? '-'
                  : l10n.durationMinutes(record.durationMinutes!),
            ),
            _AttendanceRow(
              label: l10n.attendanceVerificationStatus,
              value: record.verificationStatus ?? '-',
            ),
            if (record.autoClosed) ...[
              const _AttendanceRow(
                label: 'Check-out method',
                value: 'Auto-close',
              ),
              _AttendanceRow(
                label: 'Location verification',
                value: record.checkOutVerificationStatus ?? 'Not verified',
              ),
              _AttendanceRow(
                label: 'Auto-close reason',
                value: record.autoCloseReason ?? '-',
              ),
            ],
            _AttendanceRow(
              label: l10n.attendanceDvrStatus,
              value: record.dvrVerificationStatus ?? '-',
            ),
            if (record.verificationFailureReasons.isNotEmpty)
              _AttendanceRow(
                label: l10n.attendanceFailureReasons,
                value: record.verificationFailureReasons
                    .map((reason) => context.localizedAttendanceFailure(reason))
                    .join(', '),
              ),
            if (record.note != null && record.note!.isNotEmpty)
              _AttendanceRow(label: l10n.attendanceNote, value: record.note!),
            const SizedBox(height: 16),
            _SecureChecksNotice(),
            if (isSubmitting) ...[
              const SizedBox(height: 10),
              LinearProgressIndicator(),
            ],
            const SizedBox(height: 16),
            if (record.canCheckIn)
              FilledButton.icon(
                onPressed: isSubmitting ? null : onCheckIn,
                icon: const Icon(Icons.login),
                label: Text(
                  isSubmitting
                      ? l10n.collectingAttendanceEvidence
                      : l10n.checkIn,
                ),
              )
            else if (record.canCheckOut)
              FilledButton.icon(
                onPressed: isSubmitting ? null : onCheckOut,
                icon: const Icon(Icons.logout),
                label: Text(
                  isSubmitting
                      ? l10n.collectingAttendanceEvidence
                      : l10n.checkOut,
                ),
              )
            else
              OutlinedButton.icon(
                onPressed: null,
                icon: const Icon(Icons.check_circle_outline),
                label: Text(l10n.attendanceCompletedToday),
              ),
            if (actionError != null) ...[
              const SizedBox(height: 12),
              Text(
                actionError is AttendanceException
                    ? ([...(actionError as AttendanceException).reasons, if ((actionError as AttendanceException).reasons.isEmpty) (actionError as AttendanceException).code]
                        .map((reason) => context.localizedAttendanceFailure(reason)).join(', '))
                    : actionError is _AttendancePreflightException
                    ? (actionError as _AttendancePreflightException).reasons
                        .map((reason) => context.localizedAttendanceFailure(reason))
                        .join(', ')
                    : context.formatApiError(actionError!),
                style: TextStyle(color: theme.colorScheme.error),
              ),
            ],
            if (evidenceIssues.isNotEmpty) ...[
              const SizedBox(height: 12),
              _EvidenceIssuesList(issues: evidenceIssues),
            ],
          ],
        ),
      ),
    );
  }
}

class _AttendancePreflightException implements Exception {
  const _AttendancePreflightException(this.reasons);
  final List<String> reasons;
  @override
  String toString() => reasons.join(', ');
}

class _EvidenceIssuesList extends StatelessWidget {
  const _EvidenceIssuesList({required this.issues});

  final List<AttendanceEvidenceIssue> issues;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              context.l10n.attendanceEvidenceWarnings,
              style: theme.textTheme.titleSmall,
            ),
            const SizedBox(height: 6),
            ...issues.map(
              (issue) => Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('- ${_localizedEvidenceIssue(context, issue)}'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecureChecksNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.attendanceSecureChecks,
              style: theme.textTheme.titleSmall,
            ),
            const SizedBox(height: 6),
            Text(
              l10n.attendanceNativeChecksActive,
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _AttendanceHistoryTile extends StatelessWidget {
  const _AttendanceHistoryTile({required this.record});

  final AttendanceRecord record;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Card(
      child: ListTile(
        leading: const Icon(Icons.event_available_outlined),
        title: Text(record.date),
        subtitle: Text(
          [
            '${l10n.checkInTime}: ${context.formatShortDateTime(record.checkInAt)}',
            '${l10n.checkOutTime}: ${context.formatShortDateTime(record.checkOutAt)}',
          ].join('\n'),
        ),
        trailing: record.durationMinutes == null
            ? null
            : Text(l10n.durationMinutes(record.durationMinutes!)),
      ),
    );
  }
}

class _AttendanceRow extends StatelessWidget {
  const _AttendanceRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

bool _isNoLinkedEmployeeError(Object error) {
  if (error is! DioException) return false;
  final data = error.response?.data;
  final message = data is Map<String, dynamic> ? data['message'] : null;
  return message == 'No employee profile is linked to this account.';
}

String _localizedEvidenceIssue(
  BuildContext context,
  AttendanceEvidenceIssue issue,
) {
  final l10n = context.l10n;
  return switch (issue) {
    AttendanceEvidenceIssue.locationPermissionDenied =>
      l10n.attendanceLocationPermissionDenied,
    AttendanceEvidenceIssue.locationServiceDisabled =>
      l10n.attendanceLocationServiceDisabled,
    AttendanceEvidenceIssue.locationUnavailable => l10n.attendanceUnavailable,
    AttendanceEvidenceIssue.wifiUnavailable => l10n.attendanceWifiUnavailable,
    AttendanceEvidenceIssue.wifiRestricted => l10n.attendanceWifiRestricted,
    AttendanceEvidenceIssue.developerOptionsEnabled =>
      l10n.developerOptionsEnabled,
    AttendanceEvidenceIssue.usbDebuggingEnabled => l10n.usbDebuggingEnabled,
    AttendanceEvidenceIssue.cameraPermissionDenied =>
      l10n.attendanceCameraPermissionDenied,
    AttendanceEvidenceIssue.photoCaptureCancelled =>
      l10n.attendancePhotoCaptureCancelled,
    AttendanceEvidenceIssue.photoUploadFailed =>
      l10n.attendancePhotoUploadFailed,
  };
}
