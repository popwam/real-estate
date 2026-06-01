import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkFileToVerificationDto {
  @ApiProperty({ example: 'verification_cuid' })
  verificationId!: string;

  @ApiPropertyOptional({ example: 'TAX_CARD' })
  documentType?: string;
}
