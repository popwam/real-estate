import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateInventoryUnitDto } from './dto/create-inventory-unit.dto';
import { InventoryFiltersDto } from './dto/inventory-filters.dto';
import { UpdateInventoryUnitDto } from './dto/update-inventory-unit.dto';
import { InventoryService } from './inventory.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/units')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Permissions('inventory.create')
  @Post()
  create(
    @Body() dto: CreateInventoryUnitDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.inventoryService.create(dto, currentUser);
  }

  @Get()
  findMany(
    @Query() filters: InventoryFiltersDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.inventoryService.findMany(currentUser, filters);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.inventoryService.findOne(id, currentUser);
  }

  @Permissions('inventory.create')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryUnitDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.inventoryService.update(id, dto, currentUser);
  }
}
