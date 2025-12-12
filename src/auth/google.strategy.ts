import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
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

    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value as string,

      firstName: name.givenName as string,

      lastName: name.familyName as string,

      picture: photos[0].value as string,
      accessToken,
    };
    done(null, user);
  }
}
