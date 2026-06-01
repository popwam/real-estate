import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { DeveloperBrokerageAgreementsService } from './developer-brokerage-agreements.service';

@UseGuards(JwtAuthGuard)
@Controller('agreements')
export class DeveloperBrokerageAgreementsController {
  constructor(
    private readonly agreementsService: DeveloperBrokerageAgreementsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateAgreementDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.agreementsService.create(dto, currentUser);
  }

  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.agreementsService.findMany(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.agreementsService.findOne(id, currentUser);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.agreementsService.approve(id, currentUser);
  }

  @Patch(':id/suspend')
  suspend(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.agreementsService.suspend(id, currentUser);
  }

  @Patch(':id/terminate')
  terminate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.agreementsService.terminate(id, currentUser);
  }
}
