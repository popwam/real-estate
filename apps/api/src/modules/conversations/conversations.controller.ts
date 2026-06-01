import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/current-user.decorator';
import { assertRateLimit } from '../../common/rate-limit/rate-limit-check';
import { rateLimitOptionsFromEnv } from '../../common/rate-limit/rate-limit-config';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import { setRateLimitHeaders } from '../../common/rate-limit/rate-limit-headers';
import { buildRateLimitKey, requestIpHash } from '../../common/rate-limit/rate-limit-keys';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import type { RateLimiter } from '../../common/rate-limit/rate-limiter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CrmActivitiesService } from '../crm/crm-activities.service';
import { ListCrmActivitiesQueryDto } from '../crm/dto/list-crm-activities-query.dto';
import { ConversationsService } from './conversations.service';
import { CreateConversationFromCrmLeadDto } from './dto/create-conversation-from-crm-lead.dto';
import { CreateConversationMessageDto } from './dto/create-conversation-message.dto';
import { CreatePublicConversationMessageDto } from './dto/create-public-conversation-message.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly crmActivities: CrmActivitiesService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get('by-token/:shareToken')
  @ApiOperation({ summary: 'Resolve a public-safe conversation share token.' })
  findByToken(@Param('shareToken') shareToken: string) {
    return this.conversationsService.findByToken(shareToken);
  }

  @Post('by-token/:shareToken/messages')
  @ApiOperation({ summary: 'Create a public-safe message through a conversation share token.' })
  createPublicMessage(
    @Param('shareToken') shareToken: string,
    @Body() dto: CreatePublicConversationMessageDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.createPublicMessageWithHeaders(shareToken, dto, request, response);
  }

  private async createPublicMessageWithHeaders(
    shareToken: string,
    dto: CreatePublicConversationMessageDto,
    request: Request,
    response: Response,
  ) {
    try {
      const result = await this.conversationsService.createPublicMessageByToken(
        shareToken,
        dto,
        request,
      );
      setRateLimitHeaders(response, result.rateLimit);
      return result.body;
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List conversations in authenticated scope.' })
  findMany(
    @Query() query: ListConversationsQueryDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.conversationsService.findMany(currentUser, query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('from-crm-lead/:crmLeadId')
  @ApiOperation({ summary: 'Create or return a conversation for a CRM lead.' })
  async createFromCrmLead(
    @Param('crmLeadId') crmLeadId: string,
    @Body() dto: CreateConversationFromCrmLeadDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCrmRateLimitHeaders(
      response,
      request,
      currentUser,
      'conversation-from-lead',
      () => this.conversationsService.createFromCrmLead(crmLeadId, dto, currentUser),
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/messages')
  @ApiOperation({ summary: 'List conversation messages.' })
  listMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.conversationsService.listMessages(id, currentUser);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/messages')
  @ApiOperation({ summary: 'Create a conversation message.' })
  async createMessage(
    @Param('id') id: string,
    @Body() dto: CreateConversationMessageDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCrmRateLimitHeaders(
      response,
      request,
      currentUser,
      'conversation-message',
      () => this.conversationsService.createMessage(id, dto, currentUser),
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a conversation status in authenticated scope.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateConversationStatusDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCrmRateLimitHeaders(
      response,
      request,
      currentUser,
      'conversation-status',
      () => this.conversationsService.updateStatus(id, dto, currentUser),
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/activities')
  @ApiOperation({ summary: 'List activities for one conversation in authenticated scope.' })
  findActivities(
    @Param('id') id: string,
    @Query() query: ListCrmActivitiesQueryDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.crmActivities.findForConversation(id, currentUser, query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get one conversation in authenticated scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.conversationsService.findOne(id, currentUser);
  }

  private async withCrmRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName:
      | 'conversation-from-lead'
      | 'conversation-message'
      | 'conversation-status',
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS',
      'CRM_MUTATION_RATE_LIMIT_MAX',
      { windowSeconds: 60, max: 60 },
    );
    const key = buildRateLimitKey('crm-mutation', {
      action: actionName,
      organizationId: currentUser.organizationId,
      userId: currentUser.userId,
      ip: requestIpHash(request),
    });

    try {
      const rateLimit = await assertRateLimit(
        this.rateLimiter,
        key,
        options,
        'Too many CRM requests. Please try again shortly.',
      );
      setRateLimitHeaders(response, rateLimit);
      return await action();
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }
}
