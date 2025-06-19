import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    };
    super(options);
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { emails, displayName } = profile;
    if (!emails?.length) {
      throw new Error('No email found in Google profile');
    }
    return {
      email: emails[0].value,
      name: displayName || 'Unknown',
    };
  }
}