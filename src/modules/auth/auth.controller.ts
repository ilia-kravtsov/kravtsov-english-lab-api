import {Controller, Post, Body, UseGuards, UnauthorizedException, Req, Res} from '@nestjs/common';
import express from 'express';
import {AuthService} from './auth.service';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';
import {JwtAuthGuard} from "../../common/guards/jwt-auth.guard";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {clearRefreshTokenCookie, setRefreshTokenCookie} from "../../common/utils/cookies.util";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({passthrough: true}) res: express.Response) {
    const {user, accessToken, refreshToken} = await this.authService.register(dto);
    setRefreshTokenCookie(res, refreshToken);
    return {user, accessToken};
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({passthrough: true}) res: express.Response) {
    const {user, accessToken, refreshToken} = await this.authService.login(dto);
    setRefreshTokenCookie(res, refreshToken);

    return {user, accessToken};
  }

  @Post('refresh')
  async refresh(@Res({passthrough: true}) res: express.Response, @Req() req: express.Request) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const {accessToken, refreshToken: newRefreshToken} = await this.authService.refreshTokens(refreshToken);
    setRefreshTokenCookie(res, newRefreshToken);

    return {accessToken};
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser('userId') userId: string, @Res({passthrough: true}) res: express.Response) {
    await this.authService.logout(userId);
    clearRefreshTokenCookie(res);
    return { message: 'Logged out' };
  }
}
