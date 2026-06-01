import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import { setRateLimitHeaders } from '../../common/rate-limit/rate-limit-headers';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { PublicProjectFiltersDto } from './dto/public-project-filters.dto';
import { PublicService } from './public.service';

@ApiTags('Public APIs')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('organizations/:slug')
  @ApiOperation({ summary: 'Get a safe public organization profile by slug.' })
  getOrganization(@Param('slug') slug: string) {
    return this.publicService.getOrganization(slug);
  }

  @Get('domain/:host')
  @ApiOperation({ summary: 'Resolve a public subdomain or custom domain.' })
  resolveDomain(@Param('host') host: string) {
    return this.publicService.resolveDomain(host);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List public marketplace projects.' })
  listProjects(@Query() filters: PublicProjectFiltersDto) {
    return this.publicService.listProjects(filters);
  }

  @Get('projects/:slug')
  @ApiOperation({ summary: 'Get safe public project details by slug.' })
  getProject(@Param('slug') slug: string) {
    return this.publicService.getProject(slug);
  }

  @Get('organizations/:slug/projects')
  @ApiOperation({ summary: 'List public projects for an approved organization.' })
  getOrganizationProjects(@Param('slug') slug: string) {
    return this.publicService.getOrganizationProjects(slug);
  }

  @Post('leads')
  @ApiOperation({ summary: 'Capture a safe public lead placeholder.' })
  @ApiBody({ type: CreatePublicLeadDto })
  async createLead(
    @Body() dto: CreatePublicLeadDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.publicService.createLead(dto, request);
      setRateLimitHeaders(response, result.rateLimit);
      return result.body;
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }
}
