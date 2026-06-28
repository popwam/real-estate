import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../data/lead_claims_repository.dart';

class LeadClaimFormScreen extends ConsumerStatefulWidget {
  const LeadClaimFormScreen({super.key, required this.projectId, this.unitId});

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
      final claim = await ref
          .read(leadClaimsRepositoryProvider)
          .create(
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.leadClaimCreated)));
      context.go('/lead-claims/${claim.id}');
    } catch (error) {
      if (!mounted) {
        return;
      }
      final message = error is DioException && error.response?.statusCode == 409
          ? context.l10n.clientAlreadyRegistered
          : context.formatApiError(error);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.createLeadClaim)),
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
                        decoration: InputDecoration(
                          labelText: l10n.clientName,
                          prefixIcon: const Icon(Icons.person_outline),
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? l10n.clientNameRequired
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _clientPhone,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          labelText: l10n.clientPhone,
                          prefixIcon: const Icon(Icons.phone_outlined),
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? l10n.clientPhoneRequired
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _notes,
                        minLines: 3,
                        maxLines: 5,
                        decoration: InputDecoration(
                          labelText: l10n.notes,
                          alignLabelWithHint: true,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(l10n.sourceManual),
                      const SizedBox(height: 18),
                      FilledButton.icon(
                        onPressed: _isSubmitting ? null : _submit,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.person_add_alt_1),
                        label: Text(l10n.createLeadClaim),
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
