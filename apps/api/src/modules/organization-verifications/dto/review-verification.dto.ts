import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewVerificationDto {
  @ApiPropertyOptional({ example: 'Document is unreadable.' })
  reason?: string;

  @ApiPropertyOptional({ example: 'Please upload a clearer copy.' })
  notes?: string;
}
