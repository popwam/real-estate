export class CreateAgreementDto {
  brokerageId!: string;
  commissionOverride?: Record<string, unknown>;
  expiresAt?: string | null;
  termsUrl?: string;
}
