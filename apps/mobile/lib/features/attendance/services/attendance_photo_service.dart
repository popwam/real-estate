import 'package:camera/camera.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/network/api_client.dart';
import 'attendance_evidence_models.dart';

class AttendancePhotoService {
  AttendancePhotoService(this._dio);

  final Dio _dio;

  Future<XFile> captureLivePhoto(BuildContext context) async {
    final permission = await Permission.camera.request();
    if (!permission.isGranted) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.cameraPermissionDenied,
      );
    }

    final cameras = await availableCameras();
    if (cameras.isEmpty) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.cameraPermissionDenied,
      );
    }

    if (!context.mounted) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.photoCaptureCancelled,
      );
    }

    final photo = await Navigator.of(context).push<XFile>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _AttendanceCameraScreen(camera: cameras.first),
      ),
    );

    if (photo == null) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.photoCaptureCancelled,
      );
    }
    return photo;
  }

  Future<String> uploadAttendancePhoto(
    XFile photo, {
    required String purpose,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/hr/attendance/evidence-photo',
        data: FormData.fromMap({
          'purpose': purpose,
          'file': await MultipartFile.fromFile(
            photo.path,
            filename: _fileName(photo.path),
          ),
        }),
      );
      final fileId = response.data?['fileId'];
      if (fileId is String && fileId.trim().isNotEmpty) {
        return fileId.trim();
      }
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.photoUploadFailed,
      );
    } on AttendanceEvidenceException {
      rethrow;
    } catch (error) {
      throw AttendanceEvidenceException(
        AttendanceEvidenceIssue.photoUploadFailed,
        error,
      );
    }
  }

  String _fileName(String path) {
    final normalized = path.replaceAll('\\', '/');
    final name = normalized.split('/').last.trim();
    return name.isEmpty ? 'attendance-photo.jpg' : name;
  }
}

class _AttendanceCameraScreen extends StatefulWidget {
  const _AttendanceCameraScreen({required this.camera});

  final CameraDescription camera;

  @override
  State<_AttendanceCameraScreen> createState() =>
      _AttendanceCameraScreenState();
}

class _AttendanceCameraScreenState extends State<_AttendanceCameraScreen> {
  late final CameraController _controller;
  late final Future<void> _initialize;
  bool _capturing = false;

  @override
  void initState() {
    super.initState();
    _controller = CameraController(
      widget.camera,
      ResolutionPreset.medium,
      enableAudio: false,
    );
    _initialize = _controller.initialize();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _capture() async {
    if (_capturing) return;
    setState(() => _capturing = true);
    try {
      await _initialize;
      final photo = await _controller.takePicture();
      if (mounted) Navigator.of(context).pop(photo);
    } catch (_) {
      if (mounted) Navigator.of(context).pop();
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: FutureBuilder<void>(
        future: _initialize,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: IconButton.filled(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close),
              ),
            );
          }
          return Stack(
            fit: StackFit.expand,
            children: [
              CameraPreview(_controller),
              Positioned(
                left: 0,
                right: 0,
                bottom: 32,
                child: Center(
                  child: FilledButton(
                    onPressed: _capturing ? null : _capture,
                    child: _capturing
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.camera_alt),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

final attendancePhotoServiceProvider = Provider<AttendancePhotoService>((ref) {
  return AttendancePhotoService(ref.watch(dioProvider));
});
