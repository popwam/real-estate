import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationStatusDto {
  @ApiProperty({
    enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'REVOKED'],
    example: 'APPROVED',
  })
  status!: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED' | 'REVOKED';
}
