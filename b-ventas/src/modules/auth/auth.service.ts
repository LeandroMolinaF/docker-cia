import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { TokenService } from './tokens/token.service';
import { RegisterDto, LoginDto } from './dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private jwt: JwtService,
    private tokens: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ForbiddenException('Email already registered');

    const hash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
      },
    });

    const tokens = await this.tokens.generateTokens(
      user.id,
      user.email,
      user.role,
    );
    await this.tokens.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.tokens.generateTokens(
      user.id,
      user.email,
      user.role,
    );
    await this.tokens.storeRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const valid = await this.tokens.validateRefreshToken(userId, refreshToken);
    if (!valid) throw new ForbiddenException('Invalid refresh token');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    const tokens = await this.tokens.generateTokens(
      user.id,
      user.email,
      user.role,
    );
    await this.tokens.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}
