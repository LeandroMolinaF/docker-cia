import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto, RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@GetUser('sub') userId: string, @Req() req) {
    const refreshToken = req.user.refreshToken;
    return this.auth.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@GetUser('sub') userId: string) {
    return this.auth.logout(userId);
  }
}
