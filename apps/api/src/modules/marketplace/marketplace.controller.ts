import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { MarketplaceMapSearchDto } from './dto/marketplace-map-search.dto';
import { MarketplaceProjectFiltersDto } from './dto/marketplace-project-filters.dto';
import { MarketplaceUnitFiltersDto } from './dto/marketplace-unit-filters.dto';
import { MarketplaceService } from './marketplace.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('projects')
  @ApiOperation({ summary: 'List marketplace-visible projects.' })
  findProjects(
    @Query() filters: MarketplaceProjectFiltersDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.marketplaceService.findProjects(filters, currentUser);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get a marketplace-visible project.' })
  findProject(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.marketplaceService.findProject(id, currentUser);
  }

  @Get('units')
  @ApiOperation({ summary: 'List marketplace-visible inventory units.' })
  findUnits(
    @Query() filters: MarketplaceUnitFiltersDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.marketplaceService.findUnits(filters, currentUser);
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get a marketplace-visible inventory unit.' })
  findUnit(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.marketplaceService.findUnit(id, currentUser);
  }

  @Post('map-search')
  @ApiOperation({ summary: 'Search marketplace-visible projects by latitude/longitude box.' })
  @ApiBody({ type: MarketplaceMapSearchDto })
  mapSearch(
    @Body() dto: MarketplaceMapSearchDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.marketplaceService.mapSearch(dto, currentUser);
  }
}
