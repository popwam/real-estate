import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto';
import { DeveloperManagementService } from './developer-management.service';

@UseGuards(JwtAuthGuard)
@Controller('developer-profile')
export class DeveloperManagementController {
  constructor(
    private readonly developerManagementService: DeveloperManagementService,
  ) {}

  @Get('me')
  findMine(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.developerManagementService.findMine(currentUser);
  }

  @Patch('me')
  updateMine(
    @Body() dto: UpdateDeveloperProfileDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.developerManagementService.updateMine(dto, currentUser);
  }
}
