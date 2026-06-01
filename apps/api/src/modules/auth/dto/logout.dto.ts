import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({ example: 'refresh.jwt.token' })
  refreshToken!: string;
}
