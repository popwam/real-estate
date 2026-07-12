import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateFileMetadataDto } from './dto/create-file-metadata.dto';
import { LinkFileToVerificationDto } from './dto/link-file-to-verification.dto';
import { FilesService } from './files.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('metadata')
  @ApiOperation({
    summary: 'Create uploaded file metadata without binary upload.',
  })
  @ApiBody({ type: CreateFileMetadataDto })
  createMetadata(
    @Body() dto: CreateFileMetadataDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.createMetadata(dto, currentUser);
  }

  @Post('hr-employee-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload protected HR employee profile or face reference image.' })
  uploadHrEmployeeImage(
    @UploadedFile() file: any,
    @Body('purpose') purpose: string | undefined,
    @Body('organizationId') organizationId: string | undefined,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.uploadHrEmployeeImage(
      file,
      purpose,
      organizationId,
      currentUser,
    );
  }

  @Post('organization-document')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload a protected company official document image or PDF.' })
  uploadOrganizationDocument(
    @UploadedFile() file: any,
    @Body('organizationId') organizationId: string | undefined,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.uploadOrganizationDocument(
      file,
      organizationId,
      currentUser,
    );
  }

  @Get(':id/hr-preview')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Preview protected HR employee image.' })
  async previewHrEmployeeImage(
    @Param('id') id: string,
    @Query('purpose') purpose: string | undefined,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.filesService.openHrEmployeeImage(
      id,
      purpose,
      currentUser,
    );
    response.type(file.mimeType);
    if (file.sizeBytes) response.setHeader('Content-Length', file.sizeBytes);
    response.setHeader('Content-Disposition', 'inline');
    return new StreamableFile(file.stream);
  }

  @Get(':id/preview')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Preview protected attendance evidence image.' })
  async previewAttendanceEvidence(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.filesService.openAttendanceEvidenceFile(
      id,
      currentUser,
    );
    response.type(file.mimeType);
    if (file.sizeBytes) response.setHeader('Content-Length', file.sizeBytes);
    response.setHeader('Content-Disposition', 'inline');
    return new StreamableFile(file.stream);
  }

  @Get(':id/download')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Download protected attendance evidence image.' })
  async downloadAttendanceEvidence(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.filesService.openAttendanceEvidenceFile(
      id,
      currentUser,
    );
    response.type(file.mimeType);
    if (file.sizeBytes) response.setHeader('Content-Length', file.sizeBytes);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    return new StreamableFile(file.stream);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get uploaded file metadata within organization scope.',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.findOne(id, currentUser);
  }

  @Post(':id/link-verification')
  @ApiOperation({
    summary: 'Link file metadata to an organization verification document.',
  })
  @ApiBody({ type: LinkFileToVerificationDto })
  linkToVerification(
    @Param('id') id: string,
    @Body() dto: LinkFileToVerificationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.linkToVerification(id, dto, currentUser);
  }
}
