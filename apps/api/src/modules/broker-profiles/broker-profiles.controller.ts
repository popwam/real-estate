import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { BrokerProfilesService } from './broker-profiles.service';
import { UpdateBrokerProfileDto } from './dto/update-broker-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('broker-profile')
export class BrokerProfilesController {
  constructor(private readonly brokerProfilesService: BrokerProfilesService) {}

  @Get('me')
  findMine(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.brokerProfilesService.findMine(currentUser);
  }

  @Patch('me')
  updateMine(
    @Body() dto: UpdateBrokerProfileDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.brokerProfilesService.updateMine(dto, currentUser);
  }
}
