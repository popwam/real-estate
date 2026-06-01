import { OrganizationDomainType } from '@prisma/client';

export class CreateOrganizationDomainDto {
  domain!: string;
  type?: OrganizationDomainType;
}
