import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google Login',
    description: 'Redirects to Google OAuth page for user authentication.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google.' })
  async googleAuth() {
    // Initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google Cloud Callback',
    description:
      'Handles the callback from Google, creates/logs in user, and returns JWT.',
  })
  @ApiResponse({
    status: 200,
    description:
      'User authenticated successfully. Returns JWT access token and user info.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Google login failed.',
  })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Unauthorized. Google login failed.' });
    }
    const jwtResult = await this.authService.googleLogin(req as any);
    return res.status(200).json(jwtResult);
  }
}
