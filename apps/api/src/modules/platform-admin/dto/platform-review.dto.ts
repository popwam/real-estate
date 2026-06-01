import { ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformReviewDto {
  @ApiPropertyOptional({ example: 'Missing required document.' })
  reason?: string;

  @ApiPropertyOptional({ example: 'Reviewed by platform compliance.' })
  notes?: string;
}
