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
import { PlatformReviewDto } from './dto/platform-review.dto';
import { CreatePlatformOrganizationDto } from './dto/create-platform-organization.dto';
import { CreateOrganizationInvitationDto } from './dto/create-organization-invitation.dto';
import { PlatformAdminService } from './platform-admin.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('organizations.verify')
@ApiTags('Platform Admin')
@ApiBearerAuth()
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Get('verification-queue')
  @ApiOperation({ summary: 'Get platform verification queue.' })
  verificationQueue(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.platformAdminService.verificationQueue(currentUser);
  }

  @Get('organizations/:id/review')
  @ApiOperation({ summary: 'Get organization review dossier for platform admins.' })
  organizationReview(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.organizationReview(id, currentUser);
  }

  @Patch('organizations/:id/approve')
  @ApiOperation({ summary: 'Approve an organization from platform review.' })
  @ApiBody({ type: PlatformReviewDto })
  approveOrganization(
    @Param('id') id: string,
    @Body() dto: PlatformReviewDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.approveOrganization(id, dto, currentUser);
  }

  @Patch('organizations/:id/reject')
  @ApiOperation({ summary: 'Reject an organization from platform review.' })
  @ApiBody({ type: PlatformReviewDto })
  rejectOrganization(
    @Param('id') id: string,
    @Body() dto: PlatformReviewDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.rejectOrganization(id, dto, currentUser);
  }

  @Patch('organizations/:id/suspend')
  @ApiOperation({ summary: 'Suspend an organization.' })
  @ApiBody({ type: PlatformReviewDto })
  suspendOrganization(
    @Param('id') id: string,
    @Body() dto: PlatformReviewDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.suspendOrganization(id, dto, currentUser);
  }

  @Patch('organizations/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended organization.' })
  @ApiBody({ type: PlatformReviewDto })
  reactivateOrganization(
    @Param('id') id: string,
    @Body() dto: PlatformReviewDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.reactivateOrganization(id, dto, currentUser);
  }

  @Post('organizations')
  @ApiOperation({ summary: 'Create a company organization as a platform admin.' })
  createOrganization(
    @Body() dto: CreatePlatformOrganizationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.createOrganization(dto, currentUser);
  }

  @Get('organizations/:id/invitations')
  @ApiOperation({ summary: 'List company invitations for platform administration.' })
  listInvitations(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.listInvitations(id, currentUser);
  }

  @Post('organizations/:id/invitations')
  @ApiOperation({ summary: 'Create an expiring company invitation link.' })
  createInvitation(
    @Param('id') id: string,
    @Body() dto: CreateOrganizationInvitationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.platformAdminService.createInvitation(id, dto, currentUser);
  }
}
