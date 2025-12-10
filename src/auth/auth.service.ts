import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    let user = await this.usersService.findByEmail(req.user.email as string);

    if (!user) {
      user = await this.usersService.create({
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        picture: req.user.picture,
        accessToken: req.user.accessToken,
        wallet: {
          create: {
            balance: 0,
          },
        },
      });
    }

    // Embed user info inside the JWT
    const payload = {
      sub: user.id, // <---- THIS IS WHAT JwtStrategy READS
      email: user.email,
    };
    const token = this.jwtService.sign(payload);

    return { token };
  }
}
