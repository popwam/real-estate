import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Inspect a company invitation without exposing token internals.' })
  get(@Param('token') token: string) {
    return this.invitations.getPublicInvitation(token);
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Accept a company invitation once.' })
  accept(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return this.invitations.accept(token, dto);
  }
}
