import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LoginPayload } from './login-payload';

export class LoginDto implements LoginPayload {
  @ApiPropertyOptional({ example: 'owner@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'owner@example.com or +201001234567' })
  identifier?: string;

  @ApiPropertyOptional({ example: '+201001234567' })
  phone?: string;

  @ApiProperty({ example: 'strong-password-123' })
  password!: string;
}
