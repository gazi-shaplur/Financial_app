import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Get('google')
  google(@Res() response: Response) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    if (!clientId || !clientSecret) {
      response.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google sign-in is not configured yet.')}`);
      return;
    }
    const state = randomBytes(32).toString('hex');
    response.cookie('budgetbook_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google',
    });
    response.redirect(this.auth.googleAuthorizationUrl(state));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    response.clearCookie('budgetbook_oauth_state', { path: '/api/auth/google' });
    if (oauthError) {
      response.redirect(`${frontendUrl}/login?error=Google+sign-in+was+cancelled`);
      return;
    }
    const savedState = request.cookies?.budgetbook_oauth_state as string | undefined;
    if (!code || !state || !savedState || state.length !== savedState.length) {
      throw new BadRequestException('Google OAuth state is invalid');
    }
    const stateMatch = timingSafeEqual(Buffer.from(state), Buffer.from(savedState));
    if (!stateMatch) throw new BadRequestException('Google OAuth state is invalid');
    try {
      const result = await this.auth.googleLogin(
        code,
        request.ip,
        request.get('user-agent'),
      );
      response.cookie('budgetbook_session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: result.expiresAt,
        path: '/',
      });
      response.redirect(`${frontendUrl}/`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      response.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.auth.register(dto);
    return { user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(
      dto,
      request.ip,
      request.get('user-agent'),
    );
    response.cookie('budgetbook_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.expiresAt,
      path: '/',
    });
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout((request as any).sessionId);
    response.clearCookie('budgetbook_session', { path: '/' });
    return { success: true };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: any) {
    return this.auth.me(user);
  }
}
