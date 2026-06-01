import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users scoped to current organization, or all users for platform roles.' })
  findAll(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.usersService.findAll(currentUser);
  }

  @Post()
  @ApiOperation({ summary: 'Create or invite a user in the allowed organization scope.' })
  @ApiBody({ type: CreateUserDto })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.usersService.create(dto, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id within allowed organization scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.usersService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile or role within allowed organization scope.' })
  @ApiBody({ type: UpdateUserDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user within allowed organization scope.' })
  activate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.usersService.setActive(id, true, currentUser);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user within allowed organization scope.' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.usersService.setActive(id, false, currentUser);
  }
}
