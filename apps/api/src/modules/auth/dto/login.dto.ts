import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'owner@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'owner@example.com or +201001234567' })
  identifier?: string;

  @ApiPropertyOptional({ example: '+201001234567' })
  phone?: string;

  @ApiProperty({ example: 'strong-password-123' })
  password!: string;
}
