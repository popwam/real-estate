import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { BrokerageManagementService } from './brokerage-management.service';
import { UpdateBrokerageProfileDto } from './dto/update-brokerage-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('brokerage-profile')
export class BrokerageManagementController {
  constructor(
    private readonly brokerageManagementService: BrokerageManagementService,
  ) {}

  @Get('me')
  findMine(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.brokerageManagementService.findMine(currentUser);
  }

  @Patch('me')
  updateMine(
    @Body() dto: UpdateBrokerageProfileDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.brokerageManagementService.updateMine(dto, currentUser);
  }
}
