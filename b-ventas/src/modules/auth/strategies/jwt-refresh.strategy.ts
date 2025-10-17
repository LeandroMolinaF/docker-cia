import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { StrategyOptionsWithRequest } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly config: ConfigService) {
    const opts: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    };
    super(opts);
  }

  validate(req: Request, payload: any) {
    const auth = req.headers['authorization'] ?? '';
    const refreshToken = auth.replace(/^Bearer\s+/i, '').trim();
    return { ...payload, refreshToken };
  }
}
