import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create uploaded file metadata without binary upload.' })
  @ApiBody({ type: CreateFileMetadataDto })
  createMetadata(
    @Body() dto: CreateFileMetadataDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.createMetadata(dto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get uploaded file metadata within organization scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.findOne(id, currentUser);
  }

  @Post(':id/link-verification')
  @ApiOperation({ summary: 'Link file metadata to an organization verification document.' })
  @ApiBody({ type: LinkFileToVerificationDto })
  linkToVerification(
    @Param('id') id: string,
    @Body() dto: LinkFileToVerificationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.filesService.linkToVerification(id, dto, currentUser);
  }
}
