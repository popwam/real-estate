import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from './hash.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from './jwt.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, HashService, JwtService, JwtAuthGuard],
  exports: [AuthService, HashService, JwtService, JwtAuthGuard],
})
export class AuthModule {}
