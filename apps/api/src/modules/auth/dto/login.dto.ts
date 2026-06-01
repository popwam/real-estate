import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@example.com' })
  email!: string;

  @ApiProperty({ example: 'strong-password-123' })
  password!: string;
}
