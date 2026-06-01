export class CreatePublicLeadDto {
  organizationSlug?: string;
  projectSlug?: string;
  name!: string;
  phone!: string;
  email?: string;
  message?: string;
  sourcePage?: string;
  utm?: Record<string, unknown>;
  idempotencyKey?: string;
  website?: string;
  companyWebsite?: string;
  preferredContactMethod?: string;
  consent!: boolean;
}
