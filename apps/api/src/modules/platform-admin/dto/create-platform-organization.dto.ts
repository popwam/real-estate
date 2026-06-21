export class CreatePlatformOrganizationDto {
  name!: string;
  type!: 'DEVELOPER' | 'BROKERAGE' | 'INDIVIDUAL_BROKER';
  slug?: string;
  country?: string;
  city?: string;
  legalName?: string;
  tradeName?: string;
}
