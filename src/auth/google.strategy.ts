import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback,Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
      session: false,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: Profile,
    done: VerifyCallback,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { name, emails, photos } = profile;
    const user = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      email: emails[0].value as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      firstName: name.givenName as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      lastName: name.familyName as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      picture: photos[0].value as string,
      accessToken,
    };
    done(null, user);
  }
}
