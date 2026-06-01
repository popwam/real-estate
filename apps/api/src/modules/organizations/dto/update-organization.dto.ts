import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Developments' })
  name?: string;

  @ApiPropertyOptional({ example: 'EG' })
  country?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  city?: string;

  @ApiPropertyOptional({ example: 'pro' })
  plan?: string;

  @ApiPropertyOptional({ example: 'Acme Developments LLC' })
  legalName?: string;

  @ApiPropertyOptional({ example: 'Acme' })
  tradeName?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  website?: string;

  @ApiPropertyOptional({ example: '+201000000000' })
  phone?: string;

  @ApiPropertyOptional({ example: 'ops@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'District 5, Cairo' })
  address?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'Developer profile description.' })
  description?: string;
}
