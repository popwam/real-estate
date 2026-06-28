import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../features/lead_claims/data/lead_claim_models.dart';
import '../../../features/lead_claims/data/lead_claims_repository.dart';
import '../../../features/marketplace/data/marketplace_repository.dart';
import '../data/reservation_requests_repository.dart';

class ReservationRequestDraft {
  const ReservationRequestDraft({required this.claim});

  final LeadClaim claim;
}

class ReservationRequestFormScreen extends ConsumerStatefulWidget {
  const ReservationRequestFormScreen({super.key, required this.draft});

  final ReservationRequestDraft draft;

  @override
  ConsumerState<ReservationRequestFormScreen> createState() =>
      _ReservationRequestFormScreenState();
}

class _ReservationRequestFormScreenState
    extends ConsumerState<ReservationRequestFormScreen> {
  final _notes = TextEditingController();
  String? _unitId;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _unitId = widget.draft.claim.unitId;
  }

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);
    try {
      final request = await ref
          .read(reservationRequestsRepositoryProvider)
          .create(
            leadClaimId: widget.draft.claim.id,
            unitId: _unitId,
            notes: _notes.text,
          );
      ref.invalidate(myReservationRequestsProvider);
      ref.invalidate(leadClaimDetailProvider(widget.draft.claim.id));
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.reservationRequestStatus(request.status)),
        ),
      );
      context.go('/reservation-requests/${request.id}');
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.formatApiError(error))));
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final claim = widget.draft.claim;
    final units = claim.unitId == null
        ? ref.watch(projectUnitsProvider(claim.projectId))
        : null;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.reservationRequest)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    claim.project?.name ?? '${l10n.project} ${claim.projectId}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 14),
                  if (claim.unitId != null)
                    Text(l10n.unitLabel(claim.unit?.title ?? claim.unitId!))
                  else
                    units!.when(
                      data: (items) => DropdownButtonFormField<String>(
                        initialValue: _unitId,
                        decoration: InputDecoration(labelText: l10n.unit),
                        items: items
                            .map(
                              (unit) => DropdownMenuItem<String>(
                                value: unit.id,
                                child: Text(
                                  '${unit.title} - ${unit.basePrice == null ? l10n.priceOnRequest : context.formatMoney(unit.basePrice, currency: unit.currency)}',
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) => setState(() => _unitId = value),
                      ),
                      error: (error, _) => Text(context.formatApiError(error)),
                      loading: () => const LinearProgressIndicator(),
                    ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _notes,
                    minLines: 3,
                    maxLines: 5,
                    decoration: InputDecoration(
                      labelText: l10n.notes,
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 18),
                  FilledButton.icon(
                    onPressed: _isSubmitting || _unitId == null
                        ? null
                        : _submit,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.event_available),
                    label: Text(l10n.submitReservationRequest),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
