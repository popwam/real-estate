import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CompanyPublicService } from './company-public.service';
import {
  ReviewOrganizationDocumentDto,
  UpdateOrganizationLegalDto,
  UpdatePublicSiteDto,
  UpsertOrganizationDocumentDto,
  UpsertOrganizationOwnerDto,
} from './company-public.dto';
import { callingCodes, countries, currencies, languages, timezones } from './metadata-library';

@ApiTags('Public Company Sites')
@Controller('public')
export class PublicCompanySiteController {
  constructor(private readonly service: CompanyPublicService) {}

  @Get('sites/:slug')
  @Header('Cache-Control', 'public, max-age=120, s-maxage=300')
  @ApiOperation({ summary: 'Get public-safe company site data by slug.' })
  getSite(@Param('slug') slug: string) {
    return this.service.getPublicSite(slug);
  }

}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Company Public Site and Legal')
@ApiBearerAuth()
@Controller()
export class CompanyPublicController {
  constructor(private readonly service: CompanyPublicService) {}

  @Get('organizations/:id/public-site')
  getPublicSiteSettings(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.getPublicSiteSettings(id, user);
  }

  @Patch('organizations/:id/public-site')
  updatePublicSiteSettings(
    @Param('id') id: string,
    @Body() dto: UpdatePublicSiteDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updatePublicSiteSettings(id, dto, user);
  }

  @Get('organizations/:id/domain-diagnostics')
  getDomainDiagnostics(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.domainDiagnostics(id, user);
  }

  @Get('organizations/:id/legal')
  getLegal(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getLegal(id, user);
  }

  @Patch('organizations/:id/legal')
  updateLegal(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationLegalDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateLegal(id, dto, user);
  }

  @Get('organizations/:id/owners')
  listOwners(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listOwners(id, user);
  }

  @Post('organizations/:id/owners')
  createOwner(
    @Param('id') id: string,
    @Body() dto: UpsertOrganizationOwnerDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.createOwner(id, dto, user);
  }

  @Patch('organizations/:id/owners/:ownerId')
  updateOwner(
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
    @Body() dto: UpsertOrganizationOwnerDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateOwner(id, ownerId, dto, user);
  }

  @Delete('organizations/:id/owners/:ownerId')
  deleteOwner(
    @Param('id') id: string,
    @Param('ownerId') ownerId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.deleteOwner(id, ownerId, user);
  }

  @Get('organizations/:id/documents')
  listDocuments(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listDocuments(id, user);
  }

  @Post('organizations/:id/documents')
  createDocument(
    @Param('id') id: string,
    @Body() dto: UpsertOrganizationDocumentDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.createDocument(id, dto, user);
  }

  @Patch('organizations/:id/documents/:documentId')
  updateDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpsertOrganizationDocumentDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateDocument(id, documentId, dto, user);
  }

  @Post('organizations/:id/documents/:documentId/extract')
  extractDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.extractDocument(id, documentId, user);
  }

  @Post('organizations/:id/documents/:documentId/review')
  reviewDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() dto: ReviewOrganizationDocumentDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.reviewDocument(id, documentId, dto, user);
  }

  @Get('metadata/countries')
  metadataCountries() {
    return countries;
  }

  @Get('metadata/currencies')
  metadataCurrencies() {
    return currencies;
  }

  @Get('metadata/languages')
  metadataLanguages() {
    return languages;
  }

  @Get('metadata/timezones')
  metadataTimezones() {
    return timezones;
  }

  @Get('metadata/calling-codes')
  metadataCallingCodes() {
    return callingCodes;
  }
}
