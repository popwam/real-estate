import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'agent@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'temporary-password-123' })
  password?: string;

  @ApiPropertyOptional({ example: 'Sam' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Agent' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+201000000001' })
  phone?: string;

  @ApiPropertyOptional({ example: 'developer_sales_agent' })
  role?: string;

  @ApiPropertyOptional({ example: 'org_cuid' })
  organizationId?: string;
}
