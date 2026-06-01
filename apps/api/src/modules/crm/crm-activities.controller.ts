import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CrmActivitiesService } from './crm-activities.service';
import { ListCrmActivitiesQueryDto } from './dto/list-crm-activities-query.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('CRM Activities')
@ApiBearerAuth()
@Controller('crm')
export class CrmActivitiesController {
  constructor(private readonly crmActivities: CrmActivitiesService) {}

  @Get('activities')
  @ApiOperation({ summary: 'List CRM activities in authenticated scope.' })
  findMany(
    @Query() query: ListCrmActivitiesQueryDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.crmActivities.findMany(currentUser, query);
  }

  @Get('leads/:id/activities')
  @ApiOperation({ summary: 'List activities for one CRM lead in authenticated scope.' })
  findForLead(
    @Param('id') id: string,
    @Query() query: ListCrmActivitiesQueryDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.crmActivities.findForLead(id, currentUser, query);
  }
}
