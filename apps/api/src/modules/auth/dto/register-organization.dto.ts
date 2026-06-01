import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterOrganizationDto {
  @ApiProperty({ example: 'Acme Developments' })
  organizationName!: string;

  @ApiProperty({
    enum: ['PLATFORM', 'DEVELOPER', 'BROKERAGE', 'INDIVIDUAL_BROKER'],
    example: 'DEVELOPER',
  })
  organizationType!: 'PLATFORM' | 'DEVELOPER' | 'BROKERAGE' | 'INDIVIDUAL_BROKER';

  @ApiProperty({ example: 'owner@example.com' })
  email!: string;

  @ApiProperty({ example: 'strong-password-123' })
  password!: string;

  @ApiPropertyOptional({ example: 'Jane' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Owner' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+201000000000' })
  phone?: string;

  @ApiPropertyOptional({ example: 'EG' })
  country?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  city?: string;

  @ApiPropertyOptional({ example: 'Acme Developments LLC' })
  legalName?: string;

  @ApiPropertyOptional({ example: 'Acme' })
  tradeName?: string;
}
