import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { HrRecruitmentService } from './hr-recruitment.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('HR Recruitment')
@ApiBearerAuth()
@Controller('hr/recruitment')
export class HrRecruitmentController {
  constructor(private readonly recruitment: HrRecruitmentService) {}

  @Permissions('hr.recruitment.view')
  @Get()
  dashboard(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.dashboard(user, organizationId);
  }

  @Permissions('hr.recruitment.view')
  @Get('jobs')
  listJobs(@Query() query: Record<string, string | undefined>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.listJobs(user, query);
  }

  @Permissions('hr.recruitment.manage')
  @Post('jobs')
  createJob(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.createJob(user, body);
  }

  @Permissions('hr.recruitment.view')
  @Get('jobs/:id')
  getJob(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.getJob(user, id);
  }

  @Permissions('hr.recruitment.manage')
  @Patch('jobs/:id')
  updateJob(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.updateJob(user, id, body);
  }

  @Permissions('hr.recruitment.applicants.view')
  @Get('applicants')
  listApplicants(@Query() query: Record<string, string | undefined>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.listApplicants(user, query);
  }

  @Permissions('hr.recruitment.applicants.manage')
  @Post('applicants')
  createApplicant(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.createApplicant(user, body);
  }

  @Permissions('hr.recruitment.applicants.view')
  @Get('applicants/:id')
  getApplicant(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.getApplicant(user, id);
  }

  @Permissions('hr.recruitment.applicants.manage')
  @Patch('applicants/:id')
  updateApplicant(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.recruitment.updateApplicant(user, id, body);
  }

  @Permissions('hr.recruitment.documents.manage')
  @Post('applicants/:id/documents')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a private applicant document.' })
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.recruitment.uploadApplicantDocument(user, id, body, file);
  }

  @Permissions('hr.recruitment.documents.manage')
  @Post('applicants/:id/documents/:documentId/extract')
  extractDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.recruitment.extractApplicantDocument(user, id, documentId);
  }

  @Permissions('hr.recruitment.documents.manage')
  @Patch('applicants/:id/documents/:documentId/review')
  reviewDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.recruitment.reviewApplicantDocument(user, id, documentId, body);
  }

  @Permissions('hr.recruitment.interviews.manage')
  @Post('applicants/:id/interviews')
  createInterview(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.createInterview(user, id, body);
  }

  @Permissions('hr.recruitment.interviews.manage')
  @Patch('applicants/:id/interviews/:interviewId')
  updateInterview(
    @Param('id') id: string,
    @Param('interviewId') interviewId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.recruitment.updateInterview(user, id, interviewId, body);
  }

  @Permissions('hr.recruitment.offers.manage')
  @Post('applicants/:id/offers')
  createOffer(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.createOffer(user, id, body);
  }

  @Permissions('hr.recruitment.offers.manage')
  @Patch('applicants/:id/offers/:offerId')
  updateOffer(
    @Param('id') id: string,
    @Param('offerId') offerId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.recruitment.updateOffer(user, id, offerId, body);
  }

  @Permissions('hr.recruitment.convert_to_employee')
  @Post('applicants/:id/convert-to-employee')
  convertToEmployee(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.convertToEmployee(user, id, body);
  }

  @Permissions('hr.recruitment.view')
  @Get('settings')
  getSettings(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.getSettings(user, organizationId);
  }

  @Permissions('hr.recruitment.manage')
  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.recruitment.updateSettings(user, body);
  }
}

@ApiTags('Public Recruitment')
@Controller('public/sites/:slug')
export class PublicRecruitmentController {
  constructor(private readonly recruitment: HrRecruitmentService) {}

  @Get('jobs')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=180')
  listPublicJobs(@Param('slug') slug: string) {
    return this.recruitment.listPublicJobs(slug);
  }

  @Get('jobs/:jobId')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=180')
  getPublicJob(@Param('slug') slug: string, @Param('jobId') jobId: string) {
    return this.recruitment.getPublicJob(slug, jobId);
  }

  @Post('applications')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'graduationCertificate', maxCount: 1 },
        { name: 'nationalIdFront', maxCount: 1 },
        { name: 'nationalIdBack', maxCount: 1 },
        { name: 'militaryCertificate', maxCount: 1 },
        { name: 'lastSalaryProof', maxCount: 1 },
        { name: 'experienceCertificate', maxCount: 1 },
        { name: 'portfolio', maxCount: 1 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024, files: 8 } },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Applicant fields plus private document files.' })
  @ApiOperation({ summary: 'Submit a public applicant intake form without creating a user.' })
  submitApplication(
    @Param('slug') slug: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: Record<string, any[] | undefined>,
  ) {
    return this.recruitment.createPublicApplication(slug, body, files);
  }
}
