import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/api_error.dart';
import '../data/lead_claims_repository.dart';

class LeadClaimFormScreen extends ConsumerStatefulWidget {
  const LeadClaimFormScreen({
    super.key,
    required this.projectId,
    this.unitId,
  });

  final String projectId;
  final String? unitId;

  @override
  ConsumerState<LeadClaimFormScreen> createState() =>
      _LeadClaimFormScreenState();
}

class _LeadClaimFormScreenState extends ConsumerState<LeadClaimFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _clientName = TextEditingController();
  final _clientPhone = TextEditingController();
  final _notes = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _clientName.dispose();
    _clientPhone.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final claim = await ref.read(leadClaimsRepositoryProvider).create(
            clientName: _clientName.text.trim(),
            clientPhone: _clientPhone.text.trim(),
            projectId: widget.projectId,
            unitId: widget.unitId,
            notes: _notes.text,
          );
      ref.invalidate(myLeadClaimsProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lead claim created.')),
      );
      context.go('/lead-claims/${claim.id}');
    } catch (error) {
      if (!mounted) {
        return;
      }
      final message = error is DioException && error.response?.statusCode == 409
          ? 'This client is already registered for this project.'
          : apiErrorMessage(error);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create lead claim')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: _clientName,
                        decoration: const InputDecoration(
                          labelText: 'Client name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                                ? 'Client name is required'
                                : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _clientPhone,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Client phone',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                                ? 'Client phone is required'
                                : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _notes,
                        minLines: 3,
                        maxLines: 5,
                        decoration: const InputDecoration(
                          labelText: 'Notes',
                          alignLabelWithHint: true,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text('Source: MANUAL'),
                      const SizedBox(height: 18),
                      FilledButton.icon(
                        onPressed: _isSubmitting ? null : _submit,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.person_add_alt_1),
                        label: const Text('Create Lead Claim'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
