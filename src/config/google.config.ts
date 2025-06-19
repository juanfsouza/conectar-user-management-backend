import { ConfigService } from '@nestjs/config';

export const googleConfig = (configService: ConfigService) => ({
  clientID: configService.get('GOOGLE_CLIENT_ID'),
  clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
  callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
});