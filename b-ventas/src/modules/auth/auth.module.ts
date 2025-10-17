import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TokenService } from './tokens/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthService } from './auth.service';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    JwtRefreshStrategy,
    DatabaseService,
  ],
})
export class AuthModule {}
