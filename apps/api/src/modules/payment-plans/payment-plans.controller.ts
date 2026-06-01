import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { PaymentPlansService } from './payment-plans.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/payment-plans')
export class PaymentPlansController {
  constructor(private readonly paymentPlansService: PaymentPlansService) {}

  @Permissions('projects.edit')
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePaymentPlanDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.paymentPlansService.create(projectId, dto, currentUser);
  }

  @Get()
  findMany(
    @Param('projectId') projectId: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.paymentPlansService.findMany(projectId, currentUser);
  }
}
