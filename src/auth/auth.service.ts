import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    let user = await this.prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          picture: req.user.picture,
          accessToken: req.user.accessToken,
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      message: 'User information from google',
      user: user,
      access_token: this.jwtService.sign(payload),
    };
  }
}
