import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitVerificationDocumentDto {
  @ApiProperty({ example: 'COMMERCIAL_REGISTRATION' })
  documentType!: string;

  @ApiPropertyOptional({ example: 'file_cuid' })
  uploadedFileId?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/document.pdf' })
  documentUrl?: string;

  @ApiPropertyOptional({ example: '2027-01-01' })
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'Commercial registration copy.' })
  notes?: string;
}

export class SubmitVerificationDto {
  @ApiProperty({ type: [SubmitVerificationDocumentDto] })
  documents!: SubmitVerificationDocumentDto[];

  @ApiPropertyOptional({ example: 'Initial verification submission.' })
  notes?: string;
}
