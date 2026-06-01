import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CrmSummaryService } from './crm-summary.service';

@UseGuards(JwtAuthGuard)
@ApiTags('CRM Summary')
@ApiBearerAuth()
@Controller('crm')
export class CrmSummaryController {
  constructor(private readonly crmSummaryService: CrmSummaryService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get scoped CRM dashboard summary counts.' })
  summary(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.crmSummaryService.summary(currentUser);
  }
}
