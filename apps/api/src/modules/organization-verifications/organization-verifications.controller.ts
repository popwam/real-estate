import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { OrganizationVerificationsService } from './organization-verifications.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Organization Verifications')
@ApiBearerAuth()
@Controller()
export class OrganizationVerificationsController {
  constructor(
    private readonly organizationVerificationsService: OrganizationVerificationsService,
  ) {}

  @Post('organizations/:id/submit-verification')
  @ApiOperation({ summary: 'Submit an organization for verification with document metadata.' })
  @ApiBody({ type: SubmitVerificationDto })
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitVerificationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationVerificationsService.submit(id, dto, currentUser);
  }

  @Permissions('organizations.verify')
  @Get('organization-verifications/pending')
  @ApiOperation({ summary: 'List pending verification documents. Platform only.' })
  findPending(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.organizationVerificationsService.findPending(currentUser);
  }

  @Get('organization-verifications/:id')
  @ApiOperation({ summary: 'Get verification document by id within access scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationVerificationsService.findOne(id, currentUser);
  }

  @Permissions('organizations.verify')
  @Patch('organization-verifications/:id/approve')
  @ApiOperation({ summary: 'Approve a verification document. Platform only.' })
  @ApiBody({ type: ReviewVerificationDto })
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationVerificationsService.approve(id, dto, currentUser);
  }

  @Permissions('organizations.verify')
  @Patch('organization-verifications/:id/reject')
  @ApiOperation({ summary: 'Reject a verification document with a reason. Platform only.' })
  @ApiBody({ type: ReviewVerificationDto })
  reject(
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationVerificationsService.reject(id, dto, currentUser);
  }

  @Permissions('organizations.verify')
  @Patch('organization-verifications/:id/request-more')
  @ApiOperation({ summary: 'Request more information for a verification document. Platform only.' })
  @ApiBody({ type: ReviewVerificationDto })
  requestMore(
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationVerificationsService.requestMore(id, dto, currentUser);
  }
}
