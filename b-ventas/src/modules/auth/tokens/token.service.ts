import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { addDays } from 'date-fns';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private prisma: DatabaseService,
  ) {}

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: string, token: string) {
    const hash = await argon2.hash(token);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: addDays(new Date(), 7),
      },
    });
  }

  async validateRefreshToken(userId: string, token: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const t of tokens) {
      const valid = await argon2.verify(t.tokenHash, token);
      if (valid && t.expiresAt > new Date()) return true;
    }
    return false;
  }
}
