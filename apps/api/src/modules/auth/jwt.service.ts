import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { EnvService } from '../../config/env.service';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class JwtService {
  constructor(private readonly env: EnvService) {}

  signAccessToken(payload: Omit<JwtPayload, 'tokenKind' | 'iat' | 'exp'>) {
    return this.sign(
      { ...payload, tokenKind: 'access' },
      this.env.jwtSecret,
      this.env.jwtExpiresIn,
    );
  }

  signRefreshToken(payload: Omit<JwtPayload, 'tokenKind' | 'iat' | 'exp'>) {
    return this.sign(
      { ...payload, tokenKind: 'refresh', jti: randomUUID() },
      this.env.jwtRefreshSecret,
      this.env.jwtRefreshExpiresIn,
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    const payload = this.verify(token, this.env.jwtSecret);

    if (payload.tokenKind !== 'access') {
      throw new UnauthorizedException('Invalid access token.');
    }

    return payload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    const payload = this.verify(token, this.env.jwtRefreshSecret);

    if (payload.tokenKind !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token identifier.');
    }

    return payload;
  }

  refreshTokenExpiresAt() {
    return new Date(Date.now() + this.parseDurationMs(this.env.jwtRefreshExpiresIn));
  }

  private sign(payload: JwtPayload, secret: string, expiresIn: string) {
    const now = Math.floor(Date.now() / 1000);
    const body: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + Math.floor(this.parseDurationMs(expiresIn) / 1000),
    };
    const encodedHeader = this.base64UrlEncode(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    );
    const encodedPayload = this.base64UrlEncode(JSON.stringify(body));
    const signature = this.signSegments(encodedHeader, encodedPayload, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verify(token: string, secret: string): JwtPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid token.');
    }

    const expectedSignature = this.signSegments(
      encodedHeader,
      encodedPayload,
      secret,
    );
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature.');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired.');
    }

    return payload;
  }

  private signSegments(
    encodedHeader: string,
    encodedPayload: string,
    secret: string,
  ) {
    return createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
  }

  private base64UrlEncode(value: string) {
    return Buffer.from(value).toString('base64url');
  }

  private base64UrlDecode(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  private parseDurationMs(value: string) {
    const match = value.match(/^(\d+)(s|m|h|d)$/);

    if (!match) {
      throw new Error(`Invalid JWT duration: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit as keyof typeof multipliers];
  }
}
