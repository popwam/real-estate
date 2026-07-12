import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFileMetadataDto {
  @ApiPropertyOptional({ example: 'org_cuid' })
  organizationId?: string;

  @ApiPropertyOptional({ example: 'popwam-dev-documents' })
  bucket?: string;

  @ApiPropertyOptional({
    enum: [
      'PUBLIC_MEDIA',
      'PROJECT_MEDIA',
      'COMPANY_DOCUMENT',
      'CHAT_ATTACHMENT',
      'HR_DOCUMENT',
      'ATTENDANCE_EVIDENCE',
      'QUARANTINE',
    ],
    example: 'QUARANTINE',
  })
  filePurpose?: string;

  @ApiPropertyOptional({ enum: ['PUBLIC', 'PRIVATE'], example: 'PRIVATE' })
  visibility?: string;

  @ApiProperty({ example: 'organizations/org_cuid/commercial-registration.pdf' })
  objectKey!: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/document.pdf' })
  url?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  mimeType?: string;

  @ApiPropertyOptional({ example: 1048576 })
  sizeBytes?: number;

  @ApiPropertyOptional({ example: 'sha256-placeholder' })
  checksum?: string;
}
