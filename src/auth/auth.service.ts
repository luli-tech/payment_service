import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GoogleUser } from 'src/utils/types/express-req.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async googleLogin(req: { user: GoogleUser }) {
    if (!req.user) {
      return 'No user from google';
    }

    let user = await this.usersService.findByEmail(req.user.email);

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
      sub: user.id,
      email: user.email,
    };
    const token = this.jwtService.sign(payload);

    return { token };
  }
}
