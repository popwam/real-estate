import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import {
  CreateOnboardingDraftDto,
  ExchangeRateDto,
  ReviewFieldEvidenceDto,
  SupportedOrganizationTypeDto,
  UpdateOnboardingDraftDto,
  UploadOnboardingDocumentDto,
} from './dto/platform-onboarding.dto';
import { PlatformOnboardingService } from './platform-onboarding.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@ApiTags('Platform Metadata')
@Controller('platform/settings')
export class PlatformMetadataV2Controller {
  constructor(private readonly service: PlatformOnboardingService) {}

  @Permissions('platform.organization_types.view')
  @Get('organization-types')
  listTypes(@Query('includeArchived') includeArchived?: string) {
    return this.service.listSupportedTypes(includeArchived === 'true');
  }

  @Permissions('platform.organization_types.manage')
  @Post('organization-types')
  createType(
    @Body() dto: SupportedOrganizationTypeDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.createSupportedType(dto, actor);
  }

  @Permissions('platform.organization_types.manage')
  @Patch('organization-types/:id')
  updateType(
    @Param('id') id: string,
    @Body() dto: SupportedOrganizationTypeDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.updateSupportedType(id, dto, actor);
  }

  @Permissions('platform.organization_types.manage')
  @Delete('organization-types/:id')
  deleteType(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.deleteSupportedType(id, actor);
  }

  @Permissions('platform.countries.manage')
  @Post('countries/:id/icon')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1024 * 1024, files: 1 } }),
  )
  uploadCountryIcon(
    @Param('id') id: string,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname?: string;
    },
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.uploadCountryIcon(id, file, actor);
  }

  @Permissions('platform.exchange_rates.view')
  @Get('exchange-rates')
  listRates() {
    return this.service.listExchangeRates();
  }

  @Permissions('platform.exchange_rates.view')
  @Get('exchange-rates/provider-status')
  providerStatus() {
    return this.service.fxProviderStatus();
  }

  @Permissions('platform.exchange_rates.manage')
  @Post('exchange-rates')
  createRate(
    @Body() dto: ExchangeRateDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.upsertExchangeRate(null, dto, actor);
  }

  @Permissions('platform.exchange_rates.manage')
  @Patch('exchange-rates/:id')
  updateRate(
    @Param('id') id: string,
    @Body() dto: ExchangeRateDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.upsertExchangeRate(id, dto, actor);
  }

  @Permissions('platform.exchange_rates.manage')
  @Delete('exchange-rates/:id')
  deleteRate(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.deleteExchangeRate(id, actor);
  }
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@ApiTags('Platform Organization Onboarding')
@Controller('platform/onboarding')
export class PlatformOnboardingController {
  constructor(private readonly service: PlatformOnboardingService) {}

  @Permissions('platform.organization_onboarding.manage')
  @Post()
  create(
    @Body() dto: CreateOnboardingDraftDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.createDraft(dto, actor);
  }

  @Permissions('platform.organization_onboarding.view')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getDraft(id);
  }

  @Permissions('platform.organization_onboarding.manage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOnboardingDraftDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.updateDraft(id, dto, actor);
  }

  @Permissions('platform.organization_onboarding.view')
  @Get(':id/required-documents')
  requiredDocuments(@Param('id') id: string) {
    return this.service.requiredDocuments(id);
  }

  @Permissions(
    'platform.organization_onboarding.manage',
    'platform.documents.manage',
  )
  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @Param('id') id: string,
    @Body() dto: UploadOnboardingDocumentDto,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.uploadDocument(id, dto, file, actor);
  }

  @Permissions(
    'platform.organization_onboarding.manage',
    'platform.documents.manage',
  )
  @Post(':id/documents/:documentId/extract')
  extract(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.runExtraction(id, documentId, actor);
  }

  @Permissions('platform.organization_onboarding.manage')
  @Patch(':id/fields/:evidenceId')
  reviewField(
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
    @Body() dto: ReviewFieldEvidenceDto,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.reviewField(id, evidenceId, dto, actor);
  }

  @Permissions('platform.organization_onboarding.view')
  @Get(':id/progress')
  progress(@Param('id') id: string) {
    return this.service.progress(id);
  }

  @Permissions('platform.organization_onboarding.manage')
  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.complete(id, actor);
  }

  @Permissions('platform.organization_onboarding.manage')
  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedRequestUser,
  ) {
    return this.service.cancel(id, actor);
  }
}
